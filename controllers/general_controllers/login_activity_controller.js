const db_query = require('../../models/db_model'); //Import db model
const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token

const login_activity = async (req, res) => {
    //Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', process.env.URL);
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept');

    let cookies = JSON.parse(JSON.stringify(req.cookies));

    if (cookies){
        if (cookies.hasOwnProperty('apex_auth')){
            let refresh_token = cookies['apex_auth'];

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
                                res.clearCookie('apex_auth');
                                res.json({ status: 'token_expired' });
                            }
                        } else {
                            let user_id = user.user_id;
                            let status = user.status;

                            if (status === 'user_direct_access_refresh_token'){
                                let result = await db_query.check_if_account_verified(user_id);

                                if (result.status === false){
                                    res.statusCode = 500;
                                    res.json({ status: 'error_occured' });
                                } else if (result.status === true){
                                    if (result.data.length > 0 && result.data.length === 1){
                                        res.statusCode = 200;
                                        var user_name = result.data[0].name;
                                        var user_email = result.data[0].email;
                                        var role = result.data[0].role;
                                        var user_id_value = result.data[0].id;
                                        var profile_img = result.data[0].profile_image;

                                        let resultx = await db_query.get_user_settings(user_id);

                                        if (resultx.status === false){
                                            res.statusCode = 500;
                                            res.json({ status: 'error_occured' });
                                        } else if (resultx.status === true){
                                            if (resultx.data.length > 0 && resultx.data.length === 1){
                                                let user_settings = {};

                                                if (role === 'Student'){
                                                    user_settings = {
                                                        user_id: resultx.data[0].user_id,
                                                        allow_email_notif: (resultx.data[0].allow_email_notif === 'true') ? true : false 
                                                    }
                                                } else if (role === 'Teacher'){
                                                    user_settings = {
                                                        user_id: resultx.data[0].user_id,
                                                        allow_email_notif: (resultx.data[0].allow_email_notif === 'true') ? true : false 
                                                    }
                                                }

                                                res.statusCode = 200;
                                                let access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                res.json({ status: true, user_settings: user_settings, details: { user_name: user_name, user_email: user_email, user_role: role, user_id: user_id_value, user_profile_image: profile_img, value: true }, accessToken: access_token });
                                            } else {
                                                res.statusCode = 401;
                                                res.json({ status: 'error_occured' });
                                            }
                                        }
                                    } else {
                                        res.statusCode = 404;
                                        res.clearCookie('apex_auth');
                                        res.json({ status: 'user_does_not_exist' });
                                    }
                                }
                            } else {
                                res.statusCode = 401;
                                res.clearCookie('apex_auth');
                                res.json({ status: 'no_access' });
                            }
                        }
                    });
                } else {
                    res.statusCode = 401;
                    res.clearCookie('apex_auth');
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

module.exports = login_activity;