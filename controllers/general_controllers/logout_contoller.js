const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db model
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header

const logout = async (req, res) => {
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

                //Filter and sanitize the access token
                let access_token = sanitize_data(form_data.access_token);

                //Check if the access token is empty or only contains white spaces
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    let refresh_token = validate_auth_header(req.headers['authorization']);

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
                                        let status = user.status;

                                        if (status === 'user_direct_access_refresh_token'){
                                            jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                                                if (err) {
                                                    let result = await db_query.delete_refresh_token(refresh_token);

                                                    if (result.status === false){
                                                        res.statusCode = 500;
                                                        res.json({ status: 'error_occured' });
                                                    } else if (result.status === true){
                                                        res.statusCode = 200;
                                                        res.json({ status: 'logged_out_successfully' });
                                                    }
                                                } else {
                                                    let result = await db_query.delete_refresh_token(refresh_token);

                                                    if (result.status === false){
                                                        res.statusCode = 500;
                                                        res.json({ status: 'error_occured' });
                                                    } else if (result.status === true){
                                                        res.statusCode = 200;
                                                        res.json({ status: 'logged_out_successfully' });
                                                    }
                                                }
                                            });
                                        } else {
                                            res.statusCode = 401;
                                            res.json({ status: 'invalid_token' });
                                        }
                                    }
                                });
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
                                        res.clearCookie('apex_auth');
                                        res.json({ status: 'token_expired' });
                                    }
                                } else {
                                    let status = user.status;

                                    if (status === 'user_direct_access_refresh_token'){
                                        jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                                            if (err) {
                                                let result = await db_query.delete_refresh_token(refresh_token);

                                                if (result.status === false){
                                                    res.statusCode = 500;
                                                    res.json({ status: 'error_occured' });
                                                } else if (result.status === true){
                                                    res.statusCode = 200;
                                                    res.clearCookie('apex_auth');
                                                    res.json({ status: 'logged_out_successfully' });
                                                }
                                            } else {
                                                let result = await db_query.delete_refresh_token(refresh_token);

                                                if (result.status === false){
                                                    res.statusCode = 500;
                                                    res.json({ status: 'error_occured' });
                                                } else if (result.status === true){
                                                    res.statusCode = 200;
                                                    res.clearCookie('apex_auth');
                                                    res.json({ status: 'logged_out_successfully' });
                                                }
                                            }
                                        });
                                    } else {
                                        res.statusCode = 401;
                                        res.json({ status: 'invalid_token' });
                                    }
                                }
                            });
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

module.exports = logout;