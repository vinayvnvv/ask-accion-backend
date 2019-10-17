const env = require('./../../env.json');
const axios = require('axios');
const COMMON_CONSTANTS = require('./../constants');
const { FILTER_POEPLE_FIELDS } = COMMON_CONSTANTS;
class ZohoService {
    getUserReport(date, emailId) {
        const op = "emailId=vinay.bv@accionlabs.com&sdate=2019-02-14 00:00:00&edate=2019-02-14 12:59:59&dateFormat=yyyy-MM-dd HH:mm:ss";
        const httpConfig = {
            method: 'get',
            url: env.zoho.host + 'attendance/getUserReport?authtoken=431fce4ebc4618dfc90d7c114f5e00f7&' + op,
            headers: {
                "content-type": "application/json",
            }
        };
        axios(httpConfig).then((res) => {
            console.log(res.data);
        }).catch((err) => {
            console.log(err);
        })
    }

    applyLeave(empId, fromDate, toDate, leaveType) {
        const inputParams = {
            "Employee_ID":  empId,
            "Leavetype":    leaveType,
            "From":         fromDate,
            "To":           toDate
        };  
        const urlParams = "?authtoken=" + env.zoho.authToken + "&inputData=" + JSON.stringify(inputParams);
        const url = env.zoho.host + 'forms/json/leave/insertRecord' + urlParams;
        const httpConfig = {
            url,
            method: 'get'
        };
        return axios(httpConfig).then((res) => {
            console.log(res.data)
            if(res.data.response.errors) return res.data.response.errors.message.From;
            return 'Applied successfully, You can check more details at https://people.zoho.com/';
        }).catch((err) => {
            // console.log(err);
            return "Error in operation! please try again.";
        });
       
    }


    getEmpId(emailId, callback) {
        const searchParams = {
            searchField: 'EmailID', 
            searchOperator: 'Contains', 
            searchText : emailId
        };

        const urlParams = "?authtoken=" + env.zoho.authToken + "&searchParams=" + JSON.stringify(searchParams);
        const url = env.zoho.host + 'forms/employee/getRecords' + urlParams;
        console.log(url);
        const httpConfig = {
            url,
            method: 'get'
        };
        console.log(searchParams, urlParams);
        axios(httpConfig).then((res) => {
            const obj = {};
            Object.keys(res.data.response.result[0]).map((key, index) => {
                obj.empId = key;
                obj.emp = res.data.response.result[0][key]
            })
            obj.emp = this.getSecureFieldsFromPeople(obj.emp, FILTER_POEPLE_FIELDS.INIT)
            callback(obj);
        }).catch((err) => {
            console.log(err);
        });
    }

    getEmpDetails(searchField, searchText, callback) {
        const searchParams = {
            searchField,
            searchOperator: 'Contains', 
            searchText
        };

        const urlParams = "?authtoken=" + env.zoho.authToken + "&searchParams=" + JSON.stringify(searchParams);
        const url = env.zoho.host + 'forms/employee/getRecords' + urlParams;
        console.log(url);
        const httpConfig = {
            url,
            method: 'get'
        };
        console.log(searchParams, urlParams);
        axios(httpConfig).then((res) => {
            callback(res.data);
        }).catch((err) => {
            console.log(err);
            callback(null);
        });
    }


    getLeaveTypeDetails(emailId, callback) {
        const urlParams = "?authtoken=" + env.zoho.authToken + "&userId=" + emailId;
        const url = env.zoho.host + 'leave/getLeaveTypeDetails' + urlParams;
        console.log(url);
        const httpConfig = {
            url,
            method: 'get'
        };
        axios(httpConfig).then((res) => {
            callback(null, res.data);
        }).catch((err) => {
            console.log(err);
            callback(err, null);
        });
    }
    getSecureFieldsFromPeople(peoples, fields) {
        return [...peoples.map(i=> {
            var obj = {};
            fields.forEach(j=>obj[j]=i[j]);
            return obj;
        })];
    }
}
module.exports = new ZohoService(); 