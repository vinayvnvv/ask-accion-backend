module.exports = {
    ROLES: {
        ADMIN: {
            SELECTOR: 'accessType',
            VALUE: 'Admin'
        }
    },
    FILTER_POEPLE_FIELDS: {
        INIT: ['EmailID', 'Date_of_birth', 'Photo', 'Gender', 'Bloodgroup', 'Employeestatus', 
                'Role', 'Project', 'Experience', 'Business_HR', 'LastName', 'EmployeeID', 'Other_Email', 
                'Work_location', 'LocationName', 'Designation', 'FirstName', 'Dateofjoining', 'Mobile', 
                'Birth_Date_as_per_Records', 'Hobbies', 'Department', 'Reporting_To', 'Expertise'],
        PEOPLE_LIST: ['EmailID', 'Photo', 'FirstName', 'LastName']
    },
    HEADERS: {
        ROLE: 'role',
        EMP_ID: 'employeeId',
        DEPARTMENT: 'department',
        HR: 'hr',
        MANAGER: 'manager',
        ACCESS_TYPE: 'accessType',
    },
    DATE_FORMATS: {
        ZOHO_DATE_FORMAT: 'DD-MMM-YYYY'
    },
    LINK_ACTIONS: {
        URL: 'url'
    }
}