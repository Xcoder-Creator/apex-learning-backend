const express = require('express'); //Import express
const router = express.Router(); //Use express router object
const cors = require('cors'); //Import cors module

//Import the required controllers
const fetch_student_details_controller = require('../../../controllers/student_controllers/fetch_student_details_controller');
const fetch_class_details_controller = require('../../../controllers/student_controllers/fetch_student_class_details_controller');
const join_class_controller = require('../../../controllers/student_controllers/student_join_class_controller');
const unenroll_controller = require('../../../controllers/student_controllers/unenroll_student_controller');
const create_post_controller = require('../../../controllers/student_controllers/student_create_post_controller');
const fetch_post_controller = require('../../../controllers/student_controllers/student_fetch_post_controller');
const student_delete_post_controller = require('../../../controllers/student_controllers/student_delete_post_controller');
const student_view_people_controller = require('../../../controllers/student_controllers/student_view_people_controller');
const student_fetch_classworks_controller = require('../../../controllers/student_controllers/student_fetch_classworks_controller');
const student_view_classwork_controller = require('../../../controllers/student_controllers/student_view_classwork_controller');
const student_send_private_comment_controller = require('../../../controllers/student_controllers/student_send_private_comment_controller');

//Fetch student details POST handler
router.options('/fetch-student-details', cors()); //Enable cors
router.post('/fetch-student-details', cors(), fetch_student_details_controller);

//Fetch student class details POST handler
router.options('/fetch-class-details', cors()); //Enable cors
router.post('/fetch-class-details', cors(), fetch_class_details_controller);

//Join class (as student) POST handler
router.options('/join-class', cors()); //Enable cors
router.post('/join-class', cors(), join_class_controller);

//Unenroll from class (as student) POST handler
router.options('/unenroll', cors()); //Enable cors
router.post('/unenroll', cors(), unenroll_controller);

//Create post (as student) POST handler
router.options('/create-post', cors()); //Enable cors
router.post('/create-post', cors(), create_post_controller);

//Fetch post (as student) POST handler
router.options('/fetch-post', cors()); //Enable cors
router.post('/fetch-post', cors(), fetch_post_controller);

//Delete post (as student) POST handler
router.options('/delete-post', cors()); //Enable cors
router.post('/delete-post', cors(), student_delete_post_controller);

//View people (as student) POST handler
router.options('/view-people', cors()); //Enable cors
router.post('/view-people', cors(), student_view_people_controller);

//Fetch classworks (as student) POST handler
router.options('/fetch-classworks', cors()); //Enable cors
router.post('/fetch-classworks', cors(), student_fetch_classworks_controller);

//View classwork (as student) POST handler
router.options('/view-classwork', cors()); //Enable cors
router.post('/view-classwork', cors(), student_view_classwork_controller);

//Send private comment (as student) POST handler
router.options('/send-private-comment', cors()); //Enable cors
router.post('/send-private-comment', cors(), student_send_private_comment_controller);

module.exports = router;