//Format date string
let format_date = (months, date) => {
    return String(months[date.getMonth()]) + ' ' + String(date.getDate()) + ', ' + date.getFullYear(); // Return fully formated date string
}

module.exports = format_date;