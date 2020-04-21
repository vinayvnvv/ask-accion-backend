const env = require('./../../env.json');
const axios = require('axios');
const CommonService = require('./common-service');
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


    async getAppliedLeavesInfo(empId, limit) {
        let urlParams = "?authtoken=" + env.zoho.authToken + "&searchColumn=EmployeeID&searchValue=" + empId;
        if(limit !== -1) {
            urlParams += ("&rec_limit=" + limit);
        }
        const url = env.zoho.host + 'forms/P_ApplyLeaveView/records' + urlParams;
        const httpConfig = {
            url,
            method: 'get'
        };
        const res = await axios(httpConfig);
        return res;
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
            let obj = {};
            Object.keys(res.data.response.result[0]).map((key, index) => {
                if(res.data.response.result[0] && res.data.response.result[0][key]) {
                    obj = res.data.response.result[0][key];
                    obj = this.getSecureFieldsFromPeople(obj, FILTER_POEPLE_FIELDS.INIT);
                    obj = obj[0];
                    obj['empId'] = key;
                }
            })
            callback(obj);
        }).catch((err) => {
            console.log(err);
        });
    }


    async getEmpDetailsForMultiFileds(searchField, searchText, callback) {
        const results = [];
        const appendResults = (res) => {
            if(res.data.response && res.data.response.result && res.data.response.result && res.data.response.result.length > 0) {
                res.data.response.result.forEach((ppl) => {
                       Object.keys(ppl).forEach((key) => {
                           console.log('key', key, JSON.parse(JSON.stringify(results)));
                            const exists = results.filter(itm => {
                                console.log('itm', itm);
                                return Object.keys(itm).map(k => k===key)[0];  
                            })[0] ;
                            if(!exists) results.push(ppl);
                       });
                });
            }
        };
        for(let i=0;i<searchField.length;i++) {
            const searchParams = {
                searchField: searchField[i],
                searchOperator: 'Contains', 
                searchText
            };
            const urlParams = "?authtoken=" + env.zoho.authToken + "&searchParams=" + JSON.stringify(searchParams);;
            const url = env.zoho.host + 'forms/employee/getRecords' + urlParams;
            const httpConfig = {
                url,
                method: 'get'
            };
            console.log(url);
            const resData = await axios(httpConfig);
            console.log(resData.data, resData.status);
            if(resData.status === 200) {
                appendResults(resData);
            } else {
                callback(null);
            }
        }

        if(results.length === 0) {
            const obj = {
                response: {
                    errors: {
                        message: 'No Records found with ' + searchText,
                    }
                }
            }
            callback(obj);
            return;
        } else {
            const obj = {
                response: {
                    result: results,
                }
            }
            callback(obj);
            return;
        }
    }

    getEmpDetails(searchField, searchText, callback) {
        if(Array.isArray(searchField)) {
            this.getEmpDetailsForMultiFileds(searchField, searchText, callback);
            return;
        }
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

    async getAttendanceReport(emailId, sdate, edate) {
        const urlParams = "?authtoken=" + env.zoho.authToken + "&emailId=" + emailId + "&sdate=" + sdate + "&edate=" + edate;
        const url = env.zoho.host + 'attendance/getUserReport' + urlParams;
        console.log(url);
        const httpConfig = {
            url,
            method: 'get'
        };
        const res = axios(httpConfig);
        return res;
    }

    getEmpDetailsByEmailId(emailId, callback) {
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
            Object.keys(res.data.response.result[0]).map((key, index) => {
                if(res.data.response.result[0] && res.data.response.result[0][key]) {
                    let obj;
                    obj = res.data.response.result[0][key];
                    obj = this.getSecureFieldsFromPeople(obj, FILTER_POEPLE_FIELDS.INIT);
                    obj = obj[0];
                    obj['empId'] = key;
                    obj['accessType'] = CommonService.getAccessType(obj['Role'], obj['Department']);
                    callback(null, obj);
                } else {
                    callback(true);
                }
            });
        }).catch((err) => {
            console.log(err);
            callback(err);
        });
    }

    getEmpDataByParams(searchField, searchText, callback) {
        const searchParams = {
            searchField, 
            searchOperator: 'Contains', 
            searchText,
        };

        const urlParams = "?authtoken=" + env.zoho.authToken + "&searchParams=" + JSON.stringify(searchParams);
        const url = env.zoho.host + 'forms/employee/getRecords' + urlParams;
        console.log(url);
        const httpConfig = {
            url,
            method: 'get'
        };
        console.log(searchParams, urlParams);
        try {
            axios(httpConfig).then((res) => {
                let result = [];
                res.data.response.result.forEach(emp => {
                    Object.keys(emp).map((key, index) => {
                        if(emp && emp[key]) {
                            let obj;
                            obj = emp[key];
                            obj = this.getSecureFieldsFromPeople(obj, FILTER_POEPLE_FIELDS.INIT);
                            result.push(obj[0]);
                            
                        }
                    });
                })
                callback(null, result);
                
            }).catch((err) => {
                console.log(err);
                callback(err);
            });
        } catch(err) {
            callback(true, null);
        }
        
    }

    getHolidaysList(userId) {
        const urlParams = "?authtoken=" + env.zoho.authToken + "&userId=" + userId;
        const url = env.zoho.host + 'leave/getHolidays' + urlParams;
        console.log(url);
        const httpConfig = {
            url,
            method: 'get'
        };
        return new Promise((resolve, reject) => {
            axios(httpConfig).then((res) => {
                if(res.data && res.data.response && res.data.response.result) {
                    resolve(res.data.response.result);
                } else {
                    reject('Error in Server! Please Try Again');
                }
            }).catch(err => {
                reject(err);
            }) ;
        });
    }

}
module.exports = new ZohoService();     