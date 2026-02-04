const express = require('express'); //Import express
const router = express.Router(); //Use express router object
const cors = require('cors'); //Import cors module

//Import the required controllers
const signup_controller = require('../../../controllers/general_controllers/signup_controller');
const verify_account_controller = require('../../../controllers/general_controllers/verify_account_controller');
const resend_verification_code_controller = require('../../../controllers/general_controllers/resend_verification_code_controller');
const login_controller = require('../../../controllers/general_controllers/login_controller');
const keep_user_logged_in_controller = require('../../../controllers/general_controllers/keep_user_logged_in_controller');
const logout_controller = require('../../../controllers/general_controllers/logout_contoller');
const login_activity_controller = require('../../../controllers/general_controllers/login_activity_controller');
const update_user_settings_controller = require('../../../controllers/general_controllers/update_user_settings_controller');
const update_profile_image_controller = require('../../../controllers/general_controllers/update_profile_image_controller');
const update_name_and_email_controller = require('../../../controllers/general_controllers/update_name_and_email_controller');
const update_user_password_controller = require('../../../controllers/general_controllers/update_user_password_controller');
const send_comment_controller = require('../../../controllers/general_controllers/send_comment_controller');
const fetch_archived_classes_controller = require('../../../controllers/general_controllers/fetch_archived_classes_controller');
const send_feedback_controller = require('../../../controllers/general_controllers/send_feedback_controller');
const submit_report_controller = require('../../../controllers/general_controllers/submit_report_controller');
const check_if_classwork_is_valid_controller = require('../../../controllers/general_controllers/check_if_classwork_is_valid_controller');
const classwork_process_controller = require('../../../controllers/general_controllers/classwork_process_controller');
const submit_work_controller = require('../../../controllers/general_controllers/submit_work_controller');
const send_reset_code_controller = require('../../../controllers/general_controllers/send_reset_code_controller');
const validate_reset_code_controller = require('../../../controllers/general_controllers/validate_reset_code_controller');
const reset_password_controller = require('../../../controllers/general_controllers/reset_password_controller');

//Signup POST handler
router.post('/signup', signup_controller);

//Login POST handler
router.post('/login', login_controller);

//Verify account POST handler
router.options('/verify-account', cors());
router.post('/verify-account', cors(), verify_account_controller);

//Resend verification code POST handler
router.options('/resend-verification-code', cors());
router.post('/resend-verification-code', cors(), resend_verification_code_controller);

//Keep user logged in POST handler
router.options('/keep-user-logged-in', cors()); //Enable cors
router.post('/keep-user-logged-in', cors(), keep_user_logged_in_controller);

//Logout POST handler
router.options('/logout', cors()); //Enable cors
router.post('/logout', cors(), logout_controller);

//Login activity GET handler
router.options('/login-activity', cors()); //Enable cors
router.get('/login-activity', cors(), login_activity_controller);

//Update user settings POST handler
router.options('/update-settings', cors()); //Enable cors
router.post('/update-settings', cors(), update_user_settings_controller);

//Update profile image POST handler
router.options('/update-profile-image', cors()); //Enable cors
router.post('/update-profile-image', cors(), update_profile_image_controller);

//Update details POST handler
router.options('/update-details', cors()); //Enable cors
router.post('/update-details', cors(), update_name_and_email_controller);

//Update user password POST handler
router.options('/update-password', cors()); //Enable cors
router.post('/update-password', cors(), update_user_password_controller);

//Send comment POST handler
router.options('/send-comment', cors()); //Enable cors
router.post('/send-comment', cors(), send_comment_controller);

//Fetch archived classes POST handler
router.options('/fetch-archived-classes', cors()); //Enable cors
router.post('/fetch-archived-classes', cors(), fetch_archived_classes_controller);

//Send feedback POST handler
router.options('/send-feedback', cors()); //Enable cors
router.post('/send-feedback', cors(), send_feedback_controller);

//Submit report POST handler
router.options('/submit-report', cors()); //Enable cors
router.post('/submit-report', cors(), submit_report_controller);

//Check classwork validity POST handler
router.options('/check-classwork-validity', cors()); //Enable cors
router.post('/check-classwork-validity', cors(), check_if_classwork_is_valid_controller);

//Classwork process POST handler
router.options('/classwork-process', cors()); //Enable cors
router.post('/classwork-process', cors(), classwork_process_controller);

//Submit work POST handler
router.options('/submit-work', cors()); //Enable cors
router.post('/submit-work', cors(), submit_work_controller);

//Reset code POST handler
router.post('/send-reset-code', send_reset_code_controller);

//Validate reset code POST handler
router.options('/validate-reset-code', cors()); //Enable cors
router.post('/validate-reset-code', cors(), validate_reset_code_controller);

//Reset password POST handler
router.options('/reset-password', cors()); //Enable cors
router.post('/reset-password', cors(), reset_password_controller);

module.exports = router;