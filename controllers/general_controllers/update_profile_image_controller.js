const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_file_name = require('../../utility/generate_file_name.util'); //Import generate file name
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const fs = require('fs'); //Import fs module

const update_profile_image = async (req, res) => {
    //Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', process.env.URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Authorization, Accept');

    let environment = process.env.ENVIRONMENT;

    if (environment === 'development'){
        //Validate the request form body data
        if (req.body){
            let form_data = req.body; //Form data from the frontend

            //Check if the appropriate request parameters are set
            if (form_data.access_token){
                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);

                //Validate the request parameters
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    let refresh_token = validate_auth_header(req.headers['authorization']); //Validate the authorization header

                    if (refresh_token == null){
                        res.statusCode = 401;
                        res.json({ status: 'missing_credentials' });
                    } else {
                        let result = await db_query.check_refresh_token(refresh_token);

                        if (result.status === false){
                            res.statusCode = 500;
                            res.json({ status: 'error_occured' });
                        } else if (result.status === true){
                            if (result.data.length > 0){
                                jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
                                    if (err){
                                        let result = await db_query.delete_refresh_token(refresh_token);

                                        if (result.status === false){
                                            res.statusCode = 500;
                                            res.json({ status: 'error_occured' });
                                        } else if (result.status === true){
                                            res.statusCode = 401;
                                            res.json({ status: 'token_expired' });
                                        }
                                    } else {
                                        let user_id = user.user_id;
                                        let status = user.status;

                                        if (status === 'user_direct_access_refresh_token'){
                                            jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                                                if (err) {
                                                    let result = await db_query.check_if_account_verified(user_id);

                                                    if (result.status === false){
                                                        res.statusCode = 500;
                                                        res.json({ status: 'error_occured' });
                                                    } else if (result.status === true){
                                                        if (result.data.length > 0 && result.data.length === 1){
                                                            var user_email = result.data[0].email; //User email
                                                            var user_name = result.data[0].name; //User name

                                                            //Check if the files object is set
                                                            if (req.files){
                                                                //Check if the user uploaded any file
                                                                if (req.files.file){
                                                                    var uploaded_files = req.files.file; //All uploaded files

                                                                    if (typeof uploaded_files === 'object'){
                                                                        if (uploaded_files.mimetype === 'image/png' || uploaded_files.mimetype === 'image/jpeg'){
                                                                            if (uploaded_files.size <= 200000){ // 200 kb in bytes
                                                                                let file_name = uploaded_files.name;
                                                                                uploaded_files.mv(`./public/user_profiles/${ user_id }/profile_img/${ file_name }`, async function (err){
                                                                                    if (err){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else {
                                                                                        let new_file_name = '';

                                                                                        if (uploaded_files.mimetype === 'image/jpeg'){
                                                                                            new_file_name = generate_file_name(15) + '.jpg';
                                                                                        } else if (uploaded_files.mimetype === 'image/png'){
                                                                                            new_file_name = generate_file_name(15) + '.png';
                                                                                        }

                                                                                        fs.rename(`./public/user_profiles/${ user_id }/profile_img/${ file_name }`, `./public/user_profiles/${ user_id }/profile_img/${ new_file_name }`, async function(err){
                                                                                            if (err){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else {
                                                                                                let result = await db_query.update_profile_image(user_id, `/user_profiles/${ user_id }/profile_img/${ new_file_name }`);

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    let result = await db_query.get_user_settings(user_id);

                                                                                                    if (result.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result.status === true){
                                                                                                        let allow_email_notif = result.data[0].allow_email_notif;
                                                                                                        
                                                                                                        if (allow_email_notif === 'false'){
                                                                                                            res.statusCode = 200;
                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                            res.json({ status: 'profile_image_updated', image_url: `/user_profiles/${ user_id }/profile_img/${ new_file_name }`, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                        } else if (allow_email_notif === 'true'){
                                                                                                            mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Profile Image Updated', 'Your profile image was changed successfully!', user_name, 'Your profile image has been changed successfully!', null, null); //Send mail

                                                                                                            res.statusCode = 200;
                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                            res.json({ status: 'profile_image_updated', image_url: `/user_profiles/${ user_id }/profile_img/${ new_file_name }`, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            } else {
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'file_size_too_big' });
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'file_not_supported' });
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'missing_credentials' });
                                                                    }
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    res.json({ status: 'missing_credentials' });
                                                                }
                                                            } else {
                                                                res.statusCode = 401;
                                                                res.json({ status: 'missing_credentials' });
                                                            }
                                                        } else {
                                                            //User does not exist
                                                            res.statusCode = 404;
                                                            res.json({ status: 'user_not_found' });
                                                        }
                                                    }
                                                } else {
                                                    let status = user.status;

                                                    if (status === 'user_direct_access_token'){
                                                        let user_auth_id = user.user_id; //Users authentication id

                                                        let result = await db_query.check_if_account_verified(user_auth_id);

                                                        if (result.status === false){
                                                            res.statusCode = 500;
                                                            res.json({ status: 'error_occured' });
                                                        } else if (result.status === true){
                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                var user_email = result.data[0].email; //User email
                                                                var user_name = result.data[0].name; //User name

                                                                //Check if the files object is set
                                                                if (req.files){

                                                                    //Check if the user uploaded any file
                                                                    if (req.files.file){
                                                                        var uploaded_files = req.files.file; //All uploaded files

                                                                        // Check if the uploaded file is an object
                                                                        if (typeof uploaded_files === 'object'){

                                                                            // Check if the file type of the uploaded file is either an image of png type or jpeg (jpg) type
                                                                            if (uploaded_files.mimetype === 'image/png' || uploaded_files.mimetype === 'image/jpeg'){

                                                                                // uploaded file size should be less than 200 kb or up to and nothing more
                                                                                if (uploaded_files.size <= 200000){ 
                                                                                    let file_name = uploaded_files.name; // Uploaded file name

                                                                                    uploaded_files.mv(`./public/user_profiles/${ user_id }/profile_img/${ file_name }`, async function (err){
                                                                                        if (err){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else {
                                                                                            let new_file_name = ''; // The new file name for the uploaded file
                                                                                            
                                                                                            // Check image file type to use to rename the uploaded file and use it to generate a new name for the uploaded file
                                                                                            if (uploaded_files.mimetype === 'image/jpeg'){
                                                                                                new_file_name = generate_file_name(15) + '.jpg';
                                                                                            } else if (uploaded_files.mimetype === 'image/png'){
                                                                                                new_file_name = generate_file_name(15) + '.png';
                                                                                            }
                                                                                            //----------------------------------------------------------------------------
                                                                                            
                                                                                            // Rename the uploaded file with the new name generated above
                                                                                            fs.rename(`./public/user_profiles/${ user_id }/profile_img/${ file_name }`, `./public/user_profiles/${ user_id }/profile_img/${ new_file_name }`, async function(err){
                                                                                                if (err){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else {
                                                                                                    let result = await db_query.update_profile_image(user_id, `/user_profiles/${ user_id }/profile_img/${ new_file_name }`);
    
                                                                                                    if (result.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result.status === true){
                                                                                                        let result = await db_query.get_user_settings(user_id);

                                                                                                        if (result.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result.status === true){
                                                                                                            let allow_email_notif = result.data[0].allow_email_notif;
                                                                                                        
                                                                                                            if (allow_email_notif === 'false'){
                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ status: 'profile_image_updated', image_url: `/user_profiles/${ user_id }/profile_img/${ new_file_name }`, token_info: 'no_token' });
                                                                                                            } else if (allow_email_notif === 'true'){
                                                                                                                mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Profile Image Updated', 'Your profile image was changed successfully!', user_name, 'Your profile image has been changed successfully!', null, null); //Send mail

                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ status: 'profile_image_updated', image_url: `/user_profiles/${ user_id }/profile_img/${ new_file_name }`, token_info: 'no_token' });
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            });
                                                                                            //-------------------------------------------------
                                                                                        }
                                                                                    });
                                                                                } else {
                                                                                    res.statusCode = 401;
                                                                                    res.json({ status: 'file_size_too_big' });
                                                                                }
                                                                                //----------------------------------------------------------------------------
                                                                            } else {
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'file_not_supported' });
                                                                            }
                                                                            //------------------------------------------------------------------------------
                                                                        } else {
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'missing_credentials' });
                                                                        }
                                                                        //-----------------------------------------------------------------------
                                                                    } else {
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'missing_credentials' });
                                                                    }
                                                                    //-------------------------------------------------------------
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    res.json({ status: 'missing_credentials' });
                                                                }
                                                                //---------------------------------------------------------
                                                            } else {
                                                                //User does not exist
                                                                res.statusCode = 404;
                                                                res.json({ status: 'user_not_found' });
                                                            }
                                                        }
                                                    } else {
                                                        res.statusCode = 401;
                                                        res.json({ status: 'invalid_token' });
                                                    }
                                                }
                                            })
                                        } else {
                                            res.statusCode = 401;
                                            res.json({ status: 'invalid_token' });
                                        }
                                    }
                                })
                            } else {
                                res.statusCode = 401;
                                res.json({ status: 'invalid_token' });
                            }
                        }
                    }
                }
            } else {
                res.statusCode = 401;
                res.json({ status: 'missing_credentials' });
            }
        } else {
            res.statusCode = 401;
            res.json({ status: 'error_occured' });
        }
    } else if (environment === 'production'){
        let access_token = validate_auth_header(req.headers['authorization']);

        if (access_token == null){
            res.statusCode = 401;
            res.json({ status: 'missing_credentials' });
        } else {
            const raw_cookies = JSON.parse(JSON.stringify(req.cookies));

            if (raw_cookies){
                if (raw_cookies.hasOwnProperty('apex_auth')){
                    let refresh_token = raw_cookies['apex_auth'];

                    let result = await db_query.check_refresh_token(refresh_token);

                    if (result.status === false){
                        res.statusCode = 500;
                        res.json({ status: 'error_occured' });
                    } else if (result.status === true){
                        if (result.data.length > 0){
                            jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
                                if (err){
                                    let result = await db_query.delete_refresh_token(refresh_token);

                                    if (result.status === false){
                                        res.statusCode = 500;
                                        res.json({ status: 'error_occured' });
                                    } else if (result.status === true){
                                        res.statusCode = 401;
                                        res.clearCookie('apex_auth'); // Clear apex auth cookie
                                        res.json({ status: 'token_expired' });
                                    }
                                } else {
                                    let user_id = user.user_id;
                                    let status = user.status;

                                    if (status === 'user_direct_access_refresh_token'){
                                        jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                                            if (err) {
                                                let result = await db_query.check_if_account_verified(user_id);

                                                if (result.status === false){
                                                    res.statusCode = 500;
                                                    res.json({ status: 'error_occured' });
                                                } else if (result.status === true){
                                                    if (result.data.length > 0 && result.data.length === 1){
                                                        var user_email = result.data[0].email; //User email
                                                        var user_name = result.data[0].name; //User name

                                                        //Check if the files object is set
                                                        if (req.files){
                                                            //Check if the user uploaded any file
                                                            if (req.files.file){
                                                                var uploaded_files = req.files.file; //All uploaded files

                                                                if (typeof uploaded_files === 'object'){
                                                                    if (uploaded_files.mimetype === 'image/png' || uploaded_files.mimetype === 'image/jpeg'){
                                                                        if (uploaded_files.size <= 200000){ // 200 kb in bytes
                                                                            let file_name = uploaded_files.name;
                                                                            uploaded_files.mv(`./public/user_profiles/${ user_id }/profile_img/${ file_name }`, async function (err){
                                                                                if (err){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else {
                                                                                    let new_file_name = '';

                                                                                    if (uploaded_files.mimetype === 'image/jpeg'){
                                                                                        new_file_name = generate_file_name(15) + '.jpg';
                                                                                    } else if (uploaded_files.mimetype === 'image/png'){
                                                                                        new_file_name = generate_file_name(15) + '.png';
                                                                                    }

                                                                                    fs.rename(`./public/user_profiles/${ user_id }/profile_img/${ file_name }`, `./public/user_profiles/${ user_id }/profile_img/${ new_file_name }`, async function(err){
                                                                                        if (err){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else {
                                                                                            let result = await db_query.update_profile_image(user_id, `/user_profiles/${ user_id }/profile_img/${ new_file_name }`);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                let result = await db_query.get_user_settings(user_id);

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    let allow_email_notif = result.data[0].allow_email_notif;
                                                                                                    
                                                                                                    if (allow_email_notif === 'false'){
                                                                                                        res.statusCode = 200;
                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                        res.json({ status: 'profile_image_updated', image_url: `/user_profiles/${ user_id }/profile_img/${ new_file_name }`, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                    } else if (allow_email_notif === 'true'){
                                                                                                        mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Profile Image Updated', 'Your profile image was changed successfully!', user_name, 'Your profile image has been changed successfully!', null, null); //Send mail

                                                                                                        res.statusCode = 200;
                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                        res.json({ status: 'profile_image_updated', image_url: `/user_profiles/${ user_id }/profile_img/${ new_file_name }`, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }
                                                                            });
                                                                        } else {
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'file_size_too_big' });
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'file_not_supported' });
                                                                    }
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    res.json({ status: 'missing_credentials' });
                                                                }
                                                            } else {
                                                                res.statusCode = 401;
                                                                res.json({ status: 'missing_credentials' });
                                                            }
                                                        } else {
                                                            res.statusCode = 401;
                                                            res.json({ status: 'missing_credentials' });
                                                        }
                                                    } else {
                                                        //User does not exist
                                                        res.statusCode = 404;
                                                        res.json({ status: 'user_not_found' });
                                                    }
                                                }
                                            } else {
                                                let status = user.status;

                                                if (status === 'user_direct_access_token'){
                                                    let user_auth_id = user.user_id; //Users authentication id

                                                    let result = await db_query.check_if_account_verified(user_auth_id);

                                                    if (result.status === false){
                                                        res.statusCode = 500;
                                                        res.json({ status: 'error_occured' });
                                                    } else if (result.status === true){
                                                        if (result.data.length > 0 && result.data.length === 1){
                                                            var user_email = result.data[0].email; //User email
                                                            var user_name = result.data[0].name; //User name

                                                            //Check if the files object is set
                                                            if (req.files){
                                                                //Check if the user uploaded any file
                                                                if (req.files.file){
                                                                    var uploaded_files = req.files.file; //All uploaded files

                                                                    if (typeof uploaded_files === 'object'){
                                                                        if (uploaded_files.mimetype === 'image/png' || uploaded_files.mimetype === 'image/jpeg'){
                                                                            if (uploaded_files.size <= 200000){ // 200 kb in bytes
                                                                                let file_name = uploaded_files.name;
                                                                                uploaded_files.mv(`./public/user_profiles/${ user_id }/profile_img/${ file_name }`, async function (err){
                                                                                    if (err){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else {
                                                                                        let new_file_name = '';

                                                                                        if (uploaded_files.mimetype === 'image/jpeg'){
                                                                                            new_file_name = generate_file_name(15) + '.jpg';
                                                                                        } else if (uploaded_files.mimetype === 'image/png'){
                                                                                            new_file_name = generate_file_name(15) + '.png';
                                                                                        }

                                                                                        fs.rename(`./public/user_profiles/${ user_id }/profile_img/${ file_name }`, `./public/user_profiles/${ user_id }/profile_img/${ new_file_name }`, async function(err){
                                                                                            if (err){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else {
                                                                                                let result = await db_query.update_profile_image(user_id, `/user_profiles/${ user_id }/profile_img/${ new_file_name }`);

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    let result = await db_query.get_user_settings(user_id);

                                                                                                    if (result.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result.status === true){
                                                                                                        let allow_email_notif = result.data[0].allow_email_notif;
                                                                                                    
                                                                                                        if (allow_email_notif === 'false'){
                                                                                                            res.statusCode = 200;
                                                                                                            res.json({ status: 'profile_image_updated', image_url: `/user_profiles/${ user_id }/profile_img/${ new_file_name }`, token_info: 'no_token' });
                                                                                                        } else if (allow_email_notif === 'true'){
                                                                                                            mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Profile Image Updated', 'Your profile image was changed successfully!', user_name, 'Your profile image has been changed successfully!', null, null); //Send mail

                                                                                                            res.statusCode = 200;
                                                                                                            res.json({ status: 'profile_image_updated', image_url: `/user_profiles/${ user_id }/profile_img/${ new_file_name }`, token_info: 'no_token' });
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            } else {
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'file_size_too_big' });
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'file_not_supported' });
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'missing_credentials' });
                                                                    }
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    res.json({ status: 'missing_credentials' });
                                                                }
                                                            } else {
                                                                res.statusCode = 401;
                                                                res.json({ status: 'missing_credentials' });
                                                            }
                                                        } else {
                                                            //User does not exist
                                                            res.statusCode = 404;
                                                            res.json({ status: 'user_not_found' });
                                                        }
                                                    }
                                                } else {
                                                    res.statusCode = 401;
                                                    res.json({ status: 'invalid_token' });
                                                }
                                            }
                                        })
                                    } else {
                                        res.statusCode = 401;
                                        res.json({ status: 'invalid_token' });
                                    }
                                }
                            })
                        } else {
                            res.statusCode = 401;
                            res.json({ status: 'invalid_token' });
                        }
                    }
                } else {
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                }
            } else {
                res.statusCode = 401;
                res.json({ status: 'missing_credentials' });
            }
        }
    }
}

module.exports = update_profile_image;