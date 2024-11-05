const indexView = (req, res, next) =>{
    res.render('home');
}

const dockerfileView = (req, res, next) =>{
    res.render('dockerfile');
}

const dockerimgView = (req, res, next) =>{
    res.render('dockerimg');
}

const dockercontainersView = (req, res, next) =>{
    res.render('dockercontainers');
}
const loginView = (req, res, next) =>{
    res.render('login');
}
const registerView = (req, res, next) =>{
    res.render('register');
}
const profileView = (req, res, next) =>{
    res.render('profile');
}
const dockerfile_listView = (req, res, next) =>{
    res.render('dockerfile_list');
}
const add_containerView = (req, res, next) =>{
    res.render('add_container');
}
module.exports = {
    indexView,
    dockerfileView,
    dockerimgView,
    dockercontainersView,
    loginView,
    registerView,
    profileView,
    dockerfile_listView,
    add_containerView

}