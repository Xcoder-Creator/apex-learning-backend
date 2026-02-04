const pool = require('../models/db_connect'); //Connect to database

//Check if a particular email exists in the database
var check_email = (email) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM account_details WHERE email = ?;', [ email ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//------------------------------------------

//Get user details by using their IDs
var get_user_by_id = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM account_details WHERE id = ?;', [ user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//------------------------------------------

//Insert a new refresh token into the database
var insert_refresh_token = (token) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO refresh_tokens(token, creation_date) VALUES(?, CURRENT_TIMESTAMP)', [ token ], (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//----------------------------------------------

//Check if a verification code exists in the database
var check_verify_code = (verify_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM verify_code WHERE verify_code = ?', [ verify_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//----------------------------------------------------

//Check if a particular verification code belongs to a particular user
var check_if_verify_code_belong_to_user = (user_id, verify_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM verify_code WHERE user_id = ? AND verify_code = ? AND status = ?;', [ user_id, verify_code, 'valid' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//----------------------------------------------------

//Check if a particular verification code is valid
var check_if_verify_code_valid = (user_id, verify_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM verify_code WHERE user_id = ? AND verify_code = ? AND status = ? AND creation_date_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE);', [ user_id, verify_code, 'valid' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//----------------------------------------------------

//Delete a verification code from the database
var delete_verify_code = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM verify_code WHERE user_id = ?', [ user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//---------------------------------------------

//Insert a new verification code into the database
var insert_verify_code = (user_id, verify_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO verify_code(user_id, verify_code, creation_date_time, status) VALUES(?, ?, CURRENT_TIMESTAMP, ?)', [ user_id, verify_code, 'valid' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//---------------------------------------------------

//Check if a refresh token exists in the database
var check_refresh_token = (token) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM refresh_tokens WHERE token = ?', [ token ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//------------------------------------------------

//Delete a refresh token from the database
var delete_refresh_token = (token) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM refresh_tokens WHERE token = ?', [ token ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-------------------------------------------

//Check if a users account is verified
var check_if_account_verified = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM account_details WHERE id = ? AND verification_status = ?', [ user_id, 'verified' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//----------------------------------------

//Verify a users account
var verify_account = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('UPDATE account_details SET verification_status = ? WHERE id = ?;', [ 'verified', user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//----------------------------------------

//Check if a users account is a student account
var check_if_student_account = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM account_details WHERE id = ? AND role = ? AND verification_status = ?', [ user_id, 'Student', 'verified' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//------------------------------------------------

//Check if a users account is a teacher account
var check_if_teacher_account = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM account_details WHERE id = ? AND role = ? AND verification_status = ?', [ user_id, 'Teacher', 'verified' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//------------------------------------------------

//Fetch all the classes that a user is a member of
var fetch_joined_classes = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM joined_classes WHERE user_id = ? AND status = ? ORDER BY id DESC', [ user_id, 'joined' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-------------------------------------------------------

//Fetch the details of a particular class
var fetch_class_details = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT creators_user_id, class_code, class_status, class_background_img, class_name, class_subject, class_room, class_section, profile_initials FROM created_classes WHERE class_code = ? AND class_status = ?', [ class_code, 'active' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch the details of a particular class
var fetch_class_details_x = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT creators_user_id, class_code, class_status, class_background_img, class_name, class_subject, class_room, class_section, profile_initials FROM created_classes WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch the details of all active classes
var fetch_all_active_class_details = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM created_classes WHERE class_code = ? AND class_status = ?', [ class_code, 'active' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch the details of all active classes using user id
var fetch_all_active_class_details_with_user_id = (class_code, user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM created_classes WHERE class_code = ? AND class_status = ? AND creators_user_id = ?', [ class_code, 'active', user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Check if a user is part of a particular class
var check_if_user_part_of_class = (user_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM joined_classes WHERE user_id = ? AND class_code = ?', [ user_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Add a user to a particular class
var join_class = (user_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO joined_classes(user_id, class_code, reg_date, status) VALUES(?, ?, CURRENT_TIMESTAMP, ?)', [ user_id, class_code, 'joined' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Check if a particular class exists
var check_if_class_exists = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM created_classes WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Remove a user from a particular class
var unenroll_from_class = (user_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM joined_classes WHERE user_id = ? AND class_code = ?', [ user_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Check if a particular account exists
var check_if_account_exists = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM account_details WHERE id = ?;', [ user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Check if a reset code exists
var check_if_reset_code_exists = (user_id, reset_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM reset_code WHERE user_id = ? AND reset_code = ? AND status = ?;', [ user_id, reset_code, 'valid' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Check if a reset code is valid
var check_if_reset_code_valid = (user_id, reset_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM reset_code WHERE user_id = ? AND reset_code = ? AND status = ? AND creation_date_time > DATE_SUB(NOW(), INTERVAL 5 MINUTE);', [ user_id, reset_code, 'valid' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch all existing account details
var fetch_all_account_details = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM account_details;', async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Update the password of a particular account
var update_password = (new_password, user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('UPDATE account_details SET password = ? WHERE id = ?;', [ new_password, user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Delete all reset codes that belong to a particular user
var delete_reset_code = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM reset_code WHERE user_id = ?;', [ user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Check if a particular reset code exists
var check_reset_code = (reset_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM reset_code WHERE reset_code = ?', [ reset_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Insert a new reset code into the database
var insert_reset_code = (user_id, reset_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO reset_code(user_id, reset_code, creation_date_time, status) VALUES(?, ?, CURRENT_TIMESTAMP, ?);', [ user_id, reset_code, 'valid' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Create a new account
var create_new_account = (user_name, user_email, user_role, password) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO account_details(name, email, role, password, verification_status, reg_date, profile_image) VALUES(?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?); SELECT LAST_INSERT_ID() AS user_id;', [ user_name, user_email, user_role, password, 'not_verified', '/images/profile_img.png' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows[1] });
                }
            })
        });
    });
}
//-----------------------------------------------

//Create a new post for a particular class
var create_new_post = (user_id, class_code, post_type, formated_date, data_content, formated_time) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO class_posts(creators_user_id, class_code, post_type, post_creation_date, post_data, edited, assignment_status, score_value, post_point, edited_date, post_title, post_due_date, post_creation_time) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); SELECT LAST_INSERT_ID() AS last_post_id;', [ user_id, class_code, post_type, formated_date, data_content, null, null, null, null, null, null, null, formated_time ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    ////console..log(err);
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows[1] });
                }
            })
        });
    });
}
//-----------------------------------------------

// Fetch a particular post from a class
var fetch_a_particular_post = (post_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM class_posts WHERE post_id = ?;', [ post_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Insert attached files for a particular post into the database
var insert_attached_files = (user_id, post_id, class_code, file_name, file_type, file_size) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO attached_files(creators_user_id, post_id, class_code, file_name, file_status, file_post_type, file_mimetype, file_size) VALUES(?, ?, ?, ?, ?, ?, ?, ?)', [ user_id, post_id, class_code, file_name, 'plain_attachment', 'post_with_attachment', file_type, file_size ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch the posts for a particular class
var fetch_class_posts = (class_code, offset) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM class_posts WHERE class_code = ? ORDER BY post_id DESC LIMIT 4 OFFSET ?', [ class_code, offset ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch a particular users account details
var fetch_user_details = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM account_details WHERE id = ?', [ user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch the attached files for a particular post if available
var fetch_attached_files = (post_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT id, post_id, class_code, file_name, file_status, file_post_type, file_mimetype, file_size FROM attached_files WHERE post_id = ?', [ post_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Delete a particular post using its post id
var delete_particular_post = (post_id, creators_user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM class_posts WHERE post_id = ? AND creators_user_id = ?;', [ post_id, creators_user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//----------------------------------------

//Fetch the details of all classes
var fetch_all_classes_details = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM created_classes WHERE class_status = ?', ['active' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch all the posts for a particular class
var fetch_all_posts_for_a_class = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM class_posts WHERE class_code = ?', [class_code], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch a particular post by its post id
var fetch_particular_post = (post_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM class_posts WHERE post_id = ?;', [ post_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//----------------------------------------

//Fetch attached files related to a particular post
var fetch_attached_files_using_post_id = (post_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT file_name, file_mimetype, file_size, post_id FROM attached_files WHERE post_id = ? AND class_code = ?;', [ post_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//----------------------------------------

//Get all the students of a particular class
var get_all_students_of_a_class = (class_code, user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM joined_classes WHERE class_code = ? AND user_id != ?', [ class_code, user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Get the users details using the users user id
var fetch_user_details_using_id = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT name, profile_image FROM account_details WHERE id = ?', [ user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//----------------------------------------

//Get the creator of a particular class
var get_creator_of_class = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT creators_user_id FROM created_classes WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//----------------------------------------

//Create new settings for a new student
var create_new_settings_for_student = (user_id, email_notif) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO user_settings(user_id, allow_email_notif) VALUES(?, ?)', [ user_id, email_notif ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//----------------------------------------

//Create new settings for a new teacher
var create_new_settings_for_teacher = (user_id, email_notif) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO user_settings(user_id, allow_email_notif) VALUES(?, ?)', [ user_id, email_notif ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//----------------------------------------

//Get the settings of a particular user
var get_user_settings = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM user_settings WHERE user_id = ?', [ user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//----------------------------------------

//Update the settings of a particular user
var update_settings_for_user = (option, value, user_id) => {
    if (option === 1){
        return new Promise((resolve, reject) => {
            pool.getConnection(async (err, connection) => {
                if(err) throw err
                connection.query('UPDATE user_settings SET allow_email_notif = ? WHERE user_id = ?', [ value, user_id ], async (err, rows) => {
                    connection.release() // return the connection to pool
    
                    if (err) {
                        return resolve({ status: false });
                    } else {
                        return resolve({ status: true });
                    }
                })
            });
        });
    }
}
//----------------------------------------

//Update the users profile image
var update_profile_image = (user_id, profile_img) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('UPDATE account_details SET profile_image = ? WHERE id = ?', [ profile_img, user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//----------------------------------------

//Update the users name and email
var update_name_and_email = (name, email, user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('UPDATE account_details SET name = ?, email = ? WHERE id = ?', [ name, email, user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//----------------------------------------

//Check the users id and email
var check_user_id_and_email = (user_id, email) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM account_details WHERE id = ? AND email = ?', [ user_id, email ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//----------------------------------------

//Delete files attached to a post
var delete_attached_files = (post_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM attached_files WHERE post_id = ?', [ post_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//----------------------------------------

// Fetch all the comments for a particular post
var fetch_comments_for_post = (post_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM public_comments WHERE post_id = ? AND class_code = ? ORDER BY id DESC', [ post_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//---------------------------------------------------

// Create a new comment for a post
var create_comment = (post_id, user_id, class_code, comment, date) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO public_comments(post_id, creators_user_id, class_code, comment_data, creation_date) VALUES(?, ?, ?, ?, ?); SELECT LAST_INSERT_ID() AS comment_id;', [ post_id, user_id, class_code, comment, date ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows[1] });
                }
            })
        });
    });
}
//---------------------------------------------------

// Create a new private comment for a classwork
var create_private_comment = (classwork_id, user_id, class_code, comment, date, student_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO private_comments(classwork_id, creators_user_id, class_code, comment_data, creation_date, student_id) VALUES(?, ?, ?, ?, ?, ?); SELECT LAST_INSERT_ID() AS comment_id;', [ classwork_id, user_id, class_code, comment, date, student_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows[1] });
                }
            })
        });
    });
}
//---------------------------------------------------

//Delete comments attached to a post
var delete_comments = (post_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM public_comments WHERE post_id = ?', [ post_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//----------------------------------------

//Fetch records of classes joined by a particular student
var fetch_records_of_joined_classes = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT class_code FROM joined_classes WHERE user_id = ?', [ user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch all records of classes joined by a particular student
var fetch_all_records_of_joined_classes = (user_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM joined_classes WHERE user_id = ? AND class_code = ?', [ user_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch all the students of a particular class
var fetch_all_students_of_joined_class = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM joined_classes WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch all the students of a particular class except a particular student
var fetch_all_students_of_joined_class_except_one = (class_code, user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM joined_classes WHERE class_code = ? AND user_id != ?', [ class_code, user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch the details of archived classes
var fetch_archived_classes = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT creators_user_id, class_code, class_status, class_background_img, class_name, class_subject, class_room, class_section, profile_initials FROM created_classes WHERE class_code = ? AND class_status = ?', [ class_code, 'archived' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

// Create a new feedback
var create_feedback = (user_id, feedback, date, time) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO user_feedback(user_id, feedback, date_sent, time_sent) VALUES(?, ?, ?, ?)', [ user_id, feedback, date, time ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//---------------------------------------------------

// Create a new report
var create_report = (user_id, report_option, report_type, formated_date, formated_time, post_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO user_report(user_id, report_option, report_type, date_submitted, time_submitted, post_id, class_code) VALUES(?, ?, ?, ?, ?, ?, ?)', [ user_id, report_option, report_type, formated_date, formated_time, post_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//---------------------------------------------------

//Fetch the active classes owned by a particular teacher
var fetch_created_classes_by_teacher = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM created_classes WHERE creators_user_id = ? AND class_status = ? ORDER BY id DESC', [ user_id, 'active' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Create a new class
var create_new_class = (class_code, user_id, class_name, class_subject, class_room, class_section, profile_initials, bg_image) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO created_classes(creators_user_id, class_code, class_status, class_background_img, class_name, class_subject, class_room, class_section, profile_initials, create_date_time) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)', [ user_id, class_code, 'active', bg_image, class_name, class_subject, class_room, class_section, profile_initials ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Check if a particular user is the owner of a particular class
var check_if_teacher_of_class = (user_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM created_classes WHERE class_code = ? AND creators_user_id = ?', [ class_code, user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Check if a particular user is the owner of a particular class and the class is active
var check_if_teacher_of_class_and_active = (user_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM created_classes WHERE class_code = ? AND creators_user_id = ? AND class_status = ?', [ class_code, user_id, 'active' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Delete a particular post
var delete_particular_post_teacher = (post_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM class_posts WHERE post_id = ?;', [ post_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Fetch archived classes for a particular teacher
var fetch_archived_classes_for_teacher = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM created_classes WHERE creators_user_id = ? AND class_status = ?;', [ user_id, 'archived' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//------------------------------------------------

//Restore archived class
var restore_archived_class = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('UPDATE created_classes SET class_status = ? WHERE class_code = ?', [ 'active', class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Check if a particular user is the owner of a particular class and that class is archived
var check_if_teacher_of_class_and_archived = (user_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM created_classes WHERE class_code = ? AND creators_user_id = ? AND class_status = ?', [ class_code, user_id, 'archived' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Delete archived class
var delete_archived_class = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM created_classes WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Delete all joined classes for a particular class
var delete_all_joined_classes = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM joined_classes WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Delete all class posts for a class
var delete_all_class_posts = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM class_posts WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Delete all attached files for a class
var delete_all_attached_files = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM attached_files WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Delete all public comments for a class
var delete_all_public_comments = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM public_comments WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Delete all private comments for a class
var delete_all_private_comments = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM private_comments WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Archive a particular class
var archive_class = (status, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('UPDATE created_classes SET class_status = ? WHERE class_code = ?', [ status, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Edit the details of a particular class
var edit_class_details = (class_code, class_name, class_subject, class_room, class_section) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('UPDATE created_classes SET class_name = ?, class_subject = ?, class_room = ?, class_section = ? WHERE class_code = ?', [ class_name, class_subject, class_room, class_section, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Change the background image of a particular class
var change_class_bg_img_name = (bg_image, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('UPDATE created_classes SET class_background_img = ? WHERE class_code = ?', [ bg_image, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Fetch all the classworks for a particular class
var fetch_all_classworks = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM classworks WHERE class_code = ? ORDER BY id DESC', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch the result of a classwork for a particular student in
var fetch_classwork_result = (classwork_id, class_code, user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM student_classwork_response WHERE classwork_id = ? AND class_code = ? AND user_id = ? LIMIT 1', [ classwork_id, class_code, user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Create a new classwork
var create_new_classwork = (class_code, user_id, title, due_date, due_time, classwork_type, q_a, date_created, time_created, instruction, date_format, points) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO classworks(class_code, user_id, title, due_date, due_time, classwork_type, q_a, date_created, time_created, instruction, date_format, points) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [ class_code, user_id, title, due_date, due_time, classwork_type, q_a, date_created, time_created, instruction, date_format, points ], async (err, result) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, full_rows: result });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch the result of a classwork for a particular student in
var fetch_a_particular_classwork = (classwork_id, user_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM classworks WHERE id = ? AND user_id = ? AND class_code = ?', [ classwork_id, user_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Check if a particular classwork exists
var check_if_classwork_exists = (classwork_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM classworks WHERE id = ? AND class_code = ?', [ classwork_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Delete classwork for a particular class
var delete_classwork = (classwork_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM classworks WHERE id = ? AND class_code = ?', [ classwork_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Delete student classwork response for a particular classwork
var delete_student_classwork_response = (classwork_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM classworks WHERE id = ? AND class_code = ?', [ classwork_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Get the details of a particular classwork
var get_particular_classwork = (classwork_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM classworks WHERE id = ? AND class_code = ?', [ classwork_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Get a students response to a particular classwork
var get_student_response_to_classwork = (classwork_id, user_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM student_classwork_response WHERE classwork_id = ? AND user_id = ? AND class_code = ?', [ classwork_id, user_id, class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Delete all classworks for a particular class
var delete_classworks_for_a_class = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM classworks WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Delete all responses for a particular classwork
var delete_classwork_response = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM student_classwork_response WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

// Fetch all the private comments for a particular classwork
var fetch_private_comments_for_classwork = (classwork_id, teacher_id, user_id, class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM private_comments WHERE classwork_id = ? AND (creators_user_id = ? OR creators_user_id = ?) AND class_code = ? AND student_id = ? ORDER BY id DESC;', [ classwork_id, teacher_id, user_id, class_code, user_id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//---------------------------------------------------

//Get the details of a particular teacher
var get_teacher_of_class = (user_id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT * FROM account_details WHERE id = ? AND verification_status = ?', [ user_id, 'verified' ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Insert student response
var insert_student_response = (classwork_id, user_id, attendance_value, response, class_code, score) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('INSERT INTO student_classwork_response(classwork_id, user_id, is_done, attendance_value, response, class_code, score) VALUES(?, ?, ?, ?, ?, ?, ?)', [ classwork_id, user_id, 1, attendance_value, response, class_code, score ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//-----------------------------------------------

//Fetch all the classworks for a particular class in an ascending order
var fetch_all_classworks_asc = (class_code) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('SELECT id, class_code, title, due_date, due_time, classwork_type, date_format FROM classworks WHERE class_code = ?', [ class_code ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true, data: rows });
                }
            })
        });
    });
}
//-----------------------------------------------

//Delete all private comments for a classwork
var delete_all_private_comments_for_classwork = (id) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if(err) throw err
            connection.query('DELETE FROM private_comments WHERE classwork_id = ?', [ id ], async (err, rows) => {
                connection.release() // return the connection to pool

                if (err) {
                    return resolve({ status: false });
                } else {
                    return resolve({ status: true });
                }
            })
        });
    });
}
//------------------------------------------------

//Export all the functions above
module.exports = {
    check_email,
    get_user_by_id,
    insert_refresh_token,
    check_verify_code,
    check_if_verify_code_belong_to_user,
    check_if_verify_code_valid,
    delete_verify_code,
    insert_verify_code,
    check_refresh_token,
    delete_refresh_token,
    check_if_account_verified,
    verify_account,
    check_if_student_account,
    check_if_teacher_account,
    fetch_joined_classes,
    fetch_class_details,
    fetch_class_details_x,
    fetch_all_active_class_details,
    fetch_all_active_class_details_with_user_id,
    check_if_user_part_of_class,
    join_class,
    check_if_class_exists,
    unenroll_from_class,
    check_if_account_exists,
    check_if_reset_code_exists,
    check_if_reset_code_valid,
    fetch_all_account_details,
    update_password,
    delete_reset_code,
    check_reset_code,
    insert_reset_code,
    create_new_account,
    create_new_post,
    insert_attached_files,
    fetch_class_posts,
    fetch_user_details,
    fetch_attached_files,
    fetch_particular_post,
    delete_particular_post,
    fetch_all_classes_details,
    fetch_all_posts_for_a_class,
    fetch_a_particular_post,
    fetch_attached_files_using_post_id,
    get_all_students_of_a_class,
    fetch_user_details_using_id,
    get_creator_of_class,
    create_new_settings_for_student,
    create_new_settings_for_teacher,
    get_user_settings,
    update_settings_for_user,
    update_profile_image,
    update_name_and_email,
    check_user_id_and_email,
    delete_attached_files,
    fetch_comments_for_post,
    create_comment,
    create_private_comment,
    delete_comments,
    fetch_records_of_joined_classes,
    fetch_all_records_of_joined_classes,
    fetch_all_students_of_joined_class,
    fetch_all_students_of_joined_class_except_one,
    fetch_archived_classes,
    create_feedback,
    create_report,
    fetch_created_classes_by_teacher,
    create_new_class,
    check_if_teacher_of_class,
    check_if_teacher_of_class_and_active,
    delete_particular_post_teacher,
    fetch_archived_classes_for_teacher,
    restore_archived_class,
    check_if_teacher_of_class_and_archived,
    delete_archived_class,
    delete_all_joined_classes,
    delete_all_attached_files,
    delete_all_class_posts,
    delete_all_private_comments,
    delete_all_public_comments,
    archive_class,
    edit_class_details,
    change_class_bg_img_name,
    fetch_all_classworks,
    fetch_classwork_result,
    create_new_classwork,
    fetch_a_particular_classwork,
    check_if_classwork_exists,
    delete_classwork,
    delete_student_classwork_response,
    get_particular_classwork,
    get_student_response_to_classwork,
    delete_classworks_for_a_class,
    delete_classwork_response,
    fetch_private_comments_for_classwork,
    get_teacher_of_class,
    insert_student_response,
    fetch_all_classworks_asc,
    delete_all_private_comments_for_classwork
}
//----------------------------------