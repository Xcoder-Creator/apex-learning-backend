//Get background image url based on bg img id
let get_class_bg_image = (bg_img_id) => {
    if (bg_img_id === 1){
        return "/images/class_background_images/backtoschool.jpg";
    } else if (bg_img_id === 2){
        return "/images/class_background_images/chemistry.jpg";
    } else if (bg_img_id === 3){
        return "/images/class_background_images/cinema.jpg";
    } else if (bg_img_id === 4){
        return "/images/class_background_images/code.jpg";
    } else if (bg_img_id === 5){
        return "/images/class_background_images/concert.jpg";
    } else if (bg_img_id === 6){
        return "/images/class_background_images/economics.jpg";
    } else if (bg_img_id === 7){
        return "/images/class_background_images/english.jpg";
    } else if (bg_img_id === 8){
        return "/images/class_background_images/geography.jpg";
    } else if (bg_img_id === 9){
        return "/images/class_background_images/graduation.jpg";
    } else if (bg_img_id === 10){
        return "/images/class_background_images/hobby.jpg";
    } else if (bg_img_id === 11){
        return "/images/class_background_images/learnlanguage.jpg";
    } else if (bg_img_id === 12){
        return "/images/class_background_images/math.jpg";
    } else if (bg_img_id === 13){
        return "/images/class_background_images/read.jpg";
    } else if (bg_img_id === 14){
        return "/images/class_background_images/soccer.jpg";
    } else if (bg_img_id === 15){
        return "/images/class_background_images/videogaming.jpg";
    } else if (bg_img_id === 16){
        return "/images/class_background_images/wrestling.jpg";
    }
}

module.exports = get_class_bg_image;