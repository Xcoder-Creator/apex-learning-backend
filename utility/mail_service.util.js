const transporter = require('../mail_configuration/mail_config'); //Import transporter for mail config

//Mail sending service utility
let mail_service = (mail_type, reciever_address, teacher_to_student, student_to_teacher, student_to_student, student_name, student_name_x, teacher_name, post_profile_img, class_name, formated_date, formated_time, post_data, post_type, class_code, subject_title, plain_mail_text, user_name, main_data, post_obj, comment_obj) => {
    var email_sender_address = 'apexlearningng@gmail.com';
    var image_logo = 'https://raw.githubusercontent.com/Xcoder-Creator/apex-learning/main/logo_apex.png';
    var url = process.env.URL;

    if (mail_type === 'plain_mail'){
        const mailData = {
            from: email_sender_address, //Sender address
            to: reciever_address, //Reciever address
            subject: `${subject_title} | Apex-Learning`, //Subject of mail
            text: plain_mail_text, //Plain mail text
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${subject_title}</title>                                      
                </head>
                <body style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 10px;">
                    <div style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 15px; border-width: 1px; border-color: #b7b7b7; border-style: solid; border-radius: 15px;">
                        <div style="margin-top: 38px; margin-bottom: 38px;">
                            <!-- process.env.API_URL -->
                            <img style="width: 45px;" src="${image_logo}" alt="logo">
                        </div>
                    
                        <div>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Hi ${user_name},</p>
                            <b style="font-size: 0.86rem; color: #b7b7b7; margin-top: 16px;">${main_data}</b>
                        </div>
                    
                        <div style="border-width: 1px; border-style: dashed; border-color: #b7b7b7; margin-top: 40px; margin-bottom: 40px;"></div>
                    
                        <div>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Apex LLC 1600 Ampitheatre</p>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Babcock University, BU 94033</p>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Nigeria</p>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">If you don't want to recieve mails from Apex Learning, you can unsubscribe.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        }

        transporter.sendMail(mailData, (err, info) => {
            if (err){
                console.log(err);
            } else {
                console.log(info);
            }
        });
    } else if (mail_type === 'post_mail'){
        if (student_to_student === true && teacher_to_student === false && student_to_teacher === false){
            const mailData = {
                from: email_sender_address, //Sender address
                to: reciever_address, //Reciever address
                subject: 'New Class Post | Apex-Learning', //Subject of mail
                text: `${student_name} has just added a new post to your class: "${class_name}"`, //Plain mail text
                html: `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>New Class Post</title>                                      
                    </head>
                    <body style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 10px;">
                        <div style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 15px; border-width: 1px; border-color: #b7b7b7; border-style: solid; border-radius: 15px;">
                            <div style="margin-top: 38px; margin-bottom: 38px;">
                                <!-- process.env.API_URL -->
                                <img style="width: 45px;" src="${image_logo}" alt="logo">
                            </div>
                        
                            <div>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Hi ${student_name_x},</p>
                                <p>
                                    <b style="color: #b7b7b7; font-size: 0.86rem;">${student_name} has just added a new post to your class: "${class_name}".</b>
                                    <div style="border: 1px solid #dadce0; border-radius: 0.5rem; background: #fff; border-top-color: #1976d2; border-top-width: 7px; padding: 14px; padding-top: 0px; margin-bottom: 17px;">
                                        <div style="margin-top: 15px; display: flex; flex-direction: row; align-items: center;">
                                            <div style="width: 45px;">
                                                <img style="height: 34px; min-width: 34px; width: 34px; object-fit: cover; border-radius: 50%;" src="${process.env.API_URL}${post_profile_img}" alt="">
                                            </div>
    
                                            <div style="margin-left: 12px;">
                                                <p style="margin: 0; font-size: .875rem; font-weight: 600; flex: 1 1 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${student_name}</p>
                                                <p style="margin: 0; font-size: .85rem; color: rgba(0,0,0,.6); font-weight: 600;">${formated_date} (${formated_time})</p>
                                            </div>
                                        </div>
    
                                        <div style="margin-top: 13px; font-size: .848rem!important; word-wrap: break-word; text-align: left; max-height: 105px; overflow-y: hidden; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                                            ${post_data}
                                        </div>
    
                                        <div>
                                            ${ (post_type === 'post_with_attachment') ? `<p style="background-color: #1976d2; width: 180px; padding: 6px; border-radius: 10px; font-size: .848rem!important; color: #fff; margin-top: 15px; text-align: center;">File attatchment available</p>` : `` }
                                        </div>
                                    </div>
                                    <b style="font-size: 0.86rem; color: #b7b7b7;">Click the link below to check it out:</b>
                                    <p>
                                        <a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${url}/student/stream?class_code=${class_code}">${url}/student/stream?class_code=${class_code}</a>
                                    </p>
                                </p>
                            </div>
                        
                            <div style="border-width: 1px; border-style: dashed; border-color: #b7b7b7; margin-top: 40px; margin-bottom: 40px;"></div>
                        
                            <div>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Apex LLC 1600 Ampitheatre</p>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Babcock University, BU 94033</p>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Nigeria</p>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">If you don't want to recieve mails from Apex Learning, you can unsubscribe.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            }
    
            transporter.sendMail(mailData, (err, info) => {
                if (err){
                    console.log(err);
                } else {
                    console.log(info);
                }
            });
        } else if (student_to_teacher === true && student_to_student === false && teacher_to_student === false){
            const mailData = {
                from: email_sender_address, //Sender address
                to: reciever_address, //Reciever address
                subject: 'New Class Post | Apex-Learning', //Subject of mail
                text: `Your student ${student_name} has added a new post to your class: "${class_name}"`, //Plain mail text
                html: `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>New Class Post</title>                                      
                    </head>
                    <body style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 10px;">
                        <div style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 15px; border-width: 1px; border-color: #b7b7b7; border-style: solid; border-radius: 15px;">
                            <div style="margin-top: 38px; margin-bottom: 38px;">
                                <!-- process.env.API_URL -->
                                <img style="width: 45px;" src="${image_logo}" alt="logo">
                            </div>
                        
                            <div>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Hi ${teacher_name},</p>
                                <p>
                                    <b style="color: #b7b7b7; font-size: 0.86rem;">Your student ${student_name} has just added a new post to your class: "${class_name}".</b>
                                    <div style="border: 1px solid #dadce0; border-radius: 0.5rem; background: #fff; border-top-color: #1976d2; border-top-width: 7px; padding: 14px; padding-top: 0px; margin-bottom: 17px;">
                                        <div style="margin-top: 15px; display: flex; flex-direction: row; align-items: center;">
                                            <div style="width: 45px;">
                                                <img style="height: 34px; min-width: 34px; width: 34px; object-fit: cover; border-radius: 50%;" src="${process.env.API_URL}${post_profile_img}" alt="">
                                            </div>

                                            <div style="margin-left: 12px;">
                                                <p style="margin: 0; font-size: .875rem; font-weight: 600; flex: 1 1 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${student_name}</p>
                                                <p style="margin: 0; font-size: .85rem; color: rgba(0,0,0,.6); font-weight: 600;">${formated_date} (${formated_time})</p>
                                            </div>
                                        </div>

                                        <div style="margin-top: 13px; font-size: .848rem!important; word-wrap: break-word; text-align: left; max-height: 105px; overflow-y: hidden; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                                            ${post_data}
                                        </div>

                                        <div>
                                            ${ (post_type === 'post_with_attachment') ? `<p style="background-color: #1976d2; width: 180px; padding: 6px; border-radius: 10px; font-size: .848rem!important; color: #fff; margin-top: 15px; text-align: center;">File attatchment available</p>` : `` }
                                        </div>
                                    </div>
                                    <b style="font-size: 0.86rem; color: #b7b7b7;">Click the link below to check it out:</b>
                                    <p>
                                        <a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${url}/teacher/stream?class_code=${class_code}">${url}/teacher/stream?class_code=${class_code}</a>
                                    </p>
                                </p>
                            </div>

                            <div style="border-width: 1px; border-style: dashed; border-color: #b7b7b7; margin-top: 40px; margin-bottom: 40px;"></div>
                        
                            <div>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Apex LLC 1600 Ampitheatre</p>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Babcock University, BU 94033</p>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Nigeria</p>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">If you don't want to recieve mails from Apex Learning, you can unsubscribe.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            }
    
            transporter.sendMail(mailData, (err, info) => {
                if (err){
                    console.log(err);
                } else {
                    console.log(info);
                }
            });
        } else if (teacher_to_student === true && student_to_teacher === false && student_to_student === false){
            const mailData = {
                from: email_sender_address, //Sender address
                to: reciever_address, //Reciever address
                subject: 'New Class Post | Apex-Learning', //Subject of mail
                text: `Your teacher just added a new post to your class: "${class_name}"`, //Plain mail text
                html: `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>New Class Post</title>
                    </head>
                    <body style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 10px;">
                        <div style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 15px; border-width: 1px; border-color: #b7b7b7; border-style: solid; border-radius: 15px;">
                            <div style="margin-top: 38px; margin-bottom: 38px;">
                                <!-- process.env.API_URL -->
                                <img style="width: 45px;" src="${image_logo}" alt="logo">
                            </div>
                        
                            <div>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Hi ${ student_name },</p>
                                <p>
                                    <b style="color: #b7b7b7; font-size: 0.86rem;">Your teacher has just added a new post to your class: "${class_name}".</b>
                                    <div style="border: 1px solid #dadce0; border-radius: 0.5rem; background: #fff; border-top-color: #1976d2; border-top-width: 7px; padding: 14px; padding-top: 0px; margin-bottom: 17px;">
                                        <div style="margin-top: 15px; display: flex; flex-direction: row; align-items: center;">
                                            <div style="width: 45px;">
                                                <img style="height: 34px; min-width: 34px; width: 34px; object-fit: cover; border-radius: 50%;" src="${process.env.API_URL}${post_profile_img}" alt="">
                                            </div>

                                            <div style="margin-left: 12px;">
                                                <p style="margin: 0; font-size: .875rem; font-weight: 600; flex: 1 1 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${teacher_name}</p>
                                                <p style="margin: 0; font-size: .85rem; color: rgba(0,0,0,.6); font-weight: 600;">${formated_date} (${formated_time})</p>
                                            </div>
                                        </div>

                                        <div style="margin-top: 13px; font-size: .848rem!important; word-wrap: break-word; text-align: left; max-height: 105px; overflow-y: hidden; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                                            ${post_data}
                                        </div>

                                        <div>
                                            ${ (post_type === 'post_with_attachment') ? `<p style="background-color: #1976d2; width: 180px; padding: 6px; border-radius: 10px; font-size: .848rem!important; color: #fff; margin-top: 15px; text-align: center;">File attatchment available</p>` : `` }
                                        </div>
                                    </div>
                                    <b style="font-size: 0.86rem; color: #b7b7b7;">Click the link below to check it out:</b>
                                    <p>
                                        <a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${url}/student/stream?class_code=${class_code}">${url}/student/stream?class_code=${class_code}</a>
                                    </p>
                                </p>
                            </div>
                        
                            <div style="border-width: 1px; border-style: dashed; border-color: #b7b7b7; margin-top: 40px; margin-bottom: 40px;"></div>
                        
                            <div>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Apex LLC 1600 Ampitheatre</p>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Babcock University, BU 94033</p>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">Nigeria</p>
                                <p style="color: #b7b7b7; font-size: 0.86rem;">If you don't want to recieve mails from Apex Learning, you can unsubscribe.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            }

            transporter.sendMail(mailData, (err, info) => {
                if (err){
                    console.log(err);
                } else {
                    console.log(info);
                }
            });
        }
    } else if (mail_type === 'public_comments_mail'){
        const mailData = {
            from: email_sender_address, //Sender address
            to: reciever_address, //Reciever address
            subject: 'Post Public Comment | Apex-Learning', //Subject of mail
            text: plain_mail_text, //Plain mail text
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Post Public Comment</title>
                </head>
                <body style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 10px;">
                    <div style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 15px; border-width: 1px; border-color: #b7b7b7; border-style: solid; border-radius: 15px;">
                        <div style="margin-top: 38px; margin-bottom: 38px;">
                            <!-- process.env.API_URL -->
                            <img style="width: 45px;" src="${image_logo}" alt="logo">
                        </div>
                    
                        <div>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Hi ${ user_name },</p>
                            <p>
                                <b style="color: #b7b7b7; font-size: 0.86rem;">${ main_data }</b>
                                <div style="border: 1px solid #dadce0; border-radius: 0.5rem; background: #fff; border-top-color: #1976d2; border-top-width: 7px; padding: 14px; padding-top: 0px; margin-bottom: 17px;">
                                    <div style="margin-top: 15px; display: flex; flex-direction: row; align-items: center;">
                                        <div style="width: 45px;">
                                            <img style="height: 34px; min-width: 34px; width: 34px; object-fit: cover; border-radius: 50%;" src="${process.env.API_URL}${post_obj.profile_image}" alt="">
                                        </div>

                                        <div style="margin-left: 12px;">
                                            <p style="margin: 0; font-size: .875rem; font-weight: 600; flex: 1 1 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${post_obj.name}</p>
                                            <p style="margin: 0; font-size: .85rem; color: rgba(0,0,0,.6); font-weight: 600;">${post_obj.date} (${post_obj.time})</p>
                                        </div>
                                    </div>

                                    <div style="margin-top: 13px; font-size: .848rem!important; word-wrap: break-word; text-align: left; max-height: 105px; overflow-y: hidden; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                                        ${post_obj.post_data}
                                    </div>

                                    <div>
                                        ${ (post_obj.post_type === 'post_with_attachment') ? `<p style="background-color: #1976d2; width: 180px; padding: 6px; border-radius: 10px; font-size: .848rem!important; color: #fff; margin-top: 15px; text-align: center;">File attatchment available</p>` : `` }
                                    </div>

                                    <div style="border-width: 1px; border-style: dashed; border-color: #b7b7b7; margin-top: 18px; margin-bottom: 18px;"></div>
                    
                                    <p style="font-size: .875rem; font-weight: 600; margin-top: 14px; margin-bottom: 14px;">New Comment:</p>

                                    <div style="border: 1px solid #dadce0; border-radius: 0.5rem; background: #fff; border-top-color: #1976d2; border-top-width: 7px; padding: 14px; padding-top: 0px; margin-bottom: 17px;">
                                        <div style="margin-top: 15px; display: flex; flex-direction: row; align-items: center;">
                                            <div style="width: 45px;">
                                                <img style="height: 34px; min-width: 34px; width: 34px; object-fit: cover; border-radius: 50%;" src="${process.env.API_URL}${comment_obj.profile_image}" alt="">
                                            </div>
                    
                                            <div style="margin-left: 12px;">
                                                <p style="margin: 0; font-size: .875rem; font-weight: 600; flex: 1 1 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${comment_obj.name}</p>
                                                <p style="margin: 0; font-size: .85rem; color: rgba(0,0,0,.6); font-weight: 600;">${comment_obj.date}</p>
                                            </div>
                                        </div>

                                        <div style="margin-top: 13px; font-size: .848rem!important; word-wrap: break-word; text-align: left; max-height: 105px; overflow-y: hidden; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                                            ${comment_obj.comment}                
                                        </div>
                                    </div>
                                </div>
                                <b style="font-size: 0.86rem; color: #b7b7b7;">Click the link below to check it out:</b>
                                <p>
                                    <a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${url}/student/stream?class_code=${class_code}">${url}/student/stream?class_code=${class_code}</a>
                                </p>
                            </p>
                        </div>
                    
                        <div style="border-width: 1px; border-style: dashed; border-color: #b7b7b7; margin-top: 40px; margin-bottom: 40px;"></div>
                    
                        <div>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Apex LLC 1600 Ampitheatre</p>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Babcock University, BU 94033</p>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Nigeria</p>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">If you don't want to recieve mails from Apex Learning, you can unsubscribe.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        }

        transporter.sendMail(mailData, (err, info) => {
            if (err){
                console.log(err);
            } else {
                console.log(info);
            }
        });
    } else if (mail_type === 'private_comments_mail'){
        const mailData = {
            from: email_sender_address, //Sender address
            to: reciever_address, //Reciever address
            subject: 'Private Comment | Apex-Learning', //Subject of mail
            text: plain_mail_text, //Plain mail text
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Private Comment</title>
                </head>
                <body style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 10px;">
                    <div style="font-family: Roboto,Helvetica,Arial,sans-serif; background: #121111; padding: 15px; border-width: 1px; border-color: #b7b7b7; border-style: solid; border-radius: 15px;">
                        <div style="margin-top: 38px; margin-bottom: 38px;">
                            <!-- process.env.API_URL -->
                            <img style="width: 45px;" src="${image_logo}" alt="logo">
                        </div>
                    
                        <div>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Hi ${ user_name },</p>
                            <p>
                                <b style="color: #b7b7b7; font-size: 0.86rem;">${ main_data }</b>
                                <div style="border: 1px solid #dadce0; border-radius: 0.5rem; background: #fff; border-top-color: #1976d2; border-top-width: 7px; padding: 14px; padding-top: 0px; margin-bottom: 17px;">
                                    <div style="margin-top: 15px; display: flex; flex-direction: row; align-items: center;">
                                        <div style="width: 45px;">
                                            <img style="height: 34px; min-width: 34px; width: 34px; object-fit: cover; border-radius: 50%;" src="${process.env.API_URL}${comment_obj.profile_image}" alt="">
                                        </div>

                                        <div style="margin-left: 12px;">
                                            <p style="margin: 0; font-size: .875rem; font-weight: 600; flex: 1 1 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${comment_obj.name}</p>
                                            <p style="margin: 0; font-size: .85rem; color: rgba(0,0,0,.6); font-weight: 600;">${comment_obj.date}</p>
                                        </div>
                                    </div>

                                    <div style="margin-top: 13px; font-size: .848rem!important; word-wrap: break-word; text-align: left; max-height: 105px; overflow-y: hidden; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                                        ${comment_obj.comment}
                                    </div>
                                </div>
                                <b style="font-size: 0.86rem; color: #b7b7b7;">Click the link below to check it out:</b>
                                <p>
                                    <a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${url}/student/view_classwork?class_code=${class_code}&id=${comment_obj.classwork_id}">${url}/student/view_classwork?class_code=${class_code}&id=${comment_obj.classwork_id}</a>
                                </p>
                            </p>
                        </div>
                    
                        <div style="border-width: 1px; border-style: dashed; border-color: #b7b7b7; margin-top: 40px; margin-bottom: 40px;"></div>
                    
                        <div>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Apex LLC 1600 Ampitheatre</p>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Babcock University, BU 94033</p>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">Nigeria</p>
                            <p style="color: #b7b7b7; font-size: 0.86rem;">If you don't want to recieve mails from Apex Learning, you can unsubscribe.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        }

        transporter.sendMail(mailData, (err, info) => {
            if (err){
                console.log(err);
            } else {
                console.log(info);
            }
        });
    }
}

module.exports = mail_service;