const express = require('express')
const handlebars = require('express-handlebars')
const app = express()
const admin = require('./rotas/admin')
const path = require('path')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('connect-flash')
require('./models/Postagem')
const Postagem = mongoose.model('postagens')
require('./models/Categoria')
const Categoria = mongoose.model('categorias')
const usuarios = require('./rotas/usuario')
const passport = require('passport')
require('./config/auth')(passport)

app.use(session({
    secret: '#BLOGAPPJUD',
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    res.locals.user = req.user || null
    next()
})

app.engine('handlebars', handlebars({
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
}))
app.set('view engine', 'handlebars')
app.use(express.json())
app.use(express.urlencoded({ extended: true}))

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/blogapp').then(() => {
    console.log('Conectado ao mongo!')
}).catch((err) => {
    console.log('erro ao se conectar: ' + err)
})

app.use(express.static(path.join(__dirname,'public')))

app.use((req, res, next) => {
    console.log('oi eu sou um middleware')
    next()
})

app.get('/', (req,res) => {
    Postagem.find().populate('categoria').sort({data: 'desc'}).then((postagens) =>{
        res.render('index', {postagens: postagens})
    }).catch((err) =>{
        req.flash('error_msg', 'Houve um erro interno: ' + err)
        redirect('/404')
    })
})

app.get('/postagem/:slug', (req, res) => {
    Postagem.findOne({slug: req.params.slug}).then((postagem) => {
        if(postagem){
            res.render('postagem/index', {postagem:postagem})
        }else{
            req.flash('error_msg', 'Esta postagem não existe')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno: ' + err)
        res.redirect('/')
    })
})

app.get('/categorias', (req, res) => {
    Categoria.find().then((categorias) => {
        res.render('categorias/index', {categorias:categorias})
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno ao listar as categorias')
        res.redirect('/')
    })
})

app.get('/categoria/:slug', (req, res) => {
    Categoria.findOne({slug: req.params.slug}).then((categoria) =>{
        if(categoria){
            Postagem.find({categoria: categoria._id}).then((postagens) => {
                res.render('categorias/postagens', {postagens: postagens, categoria: categoria})
            }).catch((err) => {
                req.flash('error_msg', 'Houve um erro ao listar os posts!')
                req.redirect('/')
            })
        }else{
            req.flash('error_msg', 'Esta categoria não existe')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno ao carregar a página dessa categoria')
        res.redirect('/')
    })
})

app.get('/404', (req,res) => {
    res.send('Erro 404!')
})

app.get('posts', (req,res) => {
    res.send('Lista posts')
})

app.use('/admin', admin)
app.use('/usuarios', usuarios)

const PORT = process.env.PORT || 8081
app.listen(PORT, () => {
    console.log('Servidor rodando!')
})