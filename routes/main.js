const express = require('express');
const { indexView, dockerfileView, dockerimgView, dockercontainersView, loginView, registerView,profileView,dockerfile_listView,add_containerView} = require('../controllers/homeController');
const { buildImage, listImages, runContainer, listContainers, manageContainer } = require('../controllers/dockerController');
const { authenticateUser, registerUser } = require('../controllers/userController');

const router = express.Router();

router.get('/', indexView);
router.get('/dockerfile', dockerfileView);
router.get('/dockerimg', dockerimgView);
router.get('/dockercontainers', dockercontainersView);
router.get('/login', loginView);
router.get('/register', registerView);
router.get('/profile', profileView);
router.get('/dockerfile_list', dockerfile_listView);
router.get('/add_container', add_containerView);






module.exports = router;
