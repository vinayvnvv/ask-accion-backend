class DateService {
    constructor() {
        this.shortMonths = ['Jan', 'Feb', 'Mar', "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    }

    getShortMonths() {
        return this.shortMonths;
    }

    getShortMonth(index) {
        return this.shortMonths[index];
    }

    getApplyLeaveDateFormat(date) {
        const dateObj = new Date(date);
        return dateObj.getDate() + "-" + this.getShortMonth(dateObj.getMonth()) + "-" + dateObj.getFullYear();
    }
    
}

module.exports = new DateService();