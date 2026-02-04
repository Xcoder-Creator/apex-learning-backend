const express = require('express'); //Import express
const router = express.Router(); //Use express router object
const cors = require('cors'); //Import cors module

//Import the required controllers
const fetch_class_details_controller = require('../../../controllers/teacher_controllers/fetch_teacher_class_details_controller');
const create_new_class_controller = require('../../../controllers/teacher_controllers/create_new_class_controller');
const teacher_fetch_post_controller = require('../../../controllers/teacher_controllers/teacher_fetch_post_controller');
const teacher_create_post_controller = require('../../../controllers/teacher_controllers/teacher_create_post_controller');
const teacher_delete_post_controller = require('../../../controllers/teacher_controllers/teacher_delete_post_controller');
const teacher_view_people_controller = require('../../../controllers/teacher_controllers/teacher_view_people_controller');
const restore_archived_class_controller = require('../../../controllers/teacher_controllers/restore_archived_class_controller');
const delete_archived_class_controller = require('../../../controllers/teacher_controllers/delete_archived_class_controller');
const archive_a_class_controller = require('../../../controllers/teacher_controllers/archive_a_class_controller');
const edit_a_class_controller = require('../../../controllers/teacher_controllers/edit_a_class_controller');
const change_class_bg_image_controller = require('../../../controllers/teacher_controllers/change_class_bg_image_controller');
const teacher_fetch_classworks_controller = require('../../../controllers/teacher_controllers/teacher_fetch_classworks_controller');
const teacher_assign_classwork_controller = require('../../../controllers/teacher_controllers/teacher_assign_classwork_controller');
const teacher_delete_classwork_controller = require('../../../controllers/teacher_controllers/teacher_delete_classwork_controller');
const teacher_view_classwork_controller = require('../../../controllers/teacher_controllers/teacher_view_classwork_controller');
const teacher_send_private_comment_controller = require('../../../controllers/teacher_controllers/teacher_send_private_comment_controller');

//Fetch teacher class details POST handler
router.options('/fetch-class-details', cors()); //Enable cors
router.post('/fetch-class-details', cors(), fetch_class_details_controller);

//Create new class POST handler
router.options('/create-new-class', cors()); //Enable cors
router.post('/create-new-class', cors(), create_new_class_controller);

//Fetch posts POST handler
router.options('/fetch-post', cors()); //Enable cors
router.post('/fetch-post', cors(), teacher_fetch_post_controller);

//Create post POST handler
router.options('/create-post', cors()); //Enable cors
router.post('/create-post', cors(), teacher_create_post_controller);

//Delete post POST handler
router.options('/delete-post', cors()); //Enable cors
router.post('/delete-post', cors(), teacher_delete_post_controller);

//View people post POST handler
router.options('/view-people', cors()); //Enable cors
router.post('/view-people', cors(), teacher_view_people_controller);

//Restore class post POST handler
router.options('/restore-class', cors()); //Enable cors
router.post('/restore-class', cors(), restore_archived_class_controller);

//Delete archived class post POST handler
router.options('/delete-archived-class', cors()); //Enable cors
router.post('/delete-archived-class', cors(), delete_archived_class_controller);

//Archive class post POST handler
router.options('/archive-class', cors()); //Enable cors
router.post('/archive-class', cors(), archive_a_class_controller);

//Edit class post POST handler
router.options('/edit-class', cors()); //Enable cors
router.post('/edit-class', cors(), edit_a_class_controller);

//Change class bg image post POST handler
router.options('/change-class-bg-image', cors()); //Enable cors
router.post('/change-class-bg-image', cors(), change_class_bg_image_controller);

//Fetch classworks post POST handler
router.options('/fetch-classworks', cors()); //Enable cors
router.post('/fetch-classworks', cors(), teacher_fetch_classworks_controller);

//Assign classwork post POST handler
router.options('/assign-classwork', cors()); //Enable cors
router.post('/assign-classwork', cors(), teacher_assign_classwork_controller);

//Delete classwork post POST handler
router.options('/delete-classwork', cors()); //Enable cors
router.post('/delete-classwork', cors(), teacher_delete_classwork_controller);

//View classwork post POST handler
router.options('/view-classwork', cors()); //Enable cors
router.post('/view-classwork', cors(), teacher_view_classwork_controller);

//Send private comment post POST handler
router.options('/send-private-comment', cors()); //Enable cors
router.post('/send-private-comment', cors(), teacher_send_private_comment_controller);

module.exports = router;