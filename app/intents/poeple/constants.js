module.exports = {
    ACTIONS: {
        GET_USER_INFO: 'get_user_info',
        PEOPLE_BY_SKILL: 'poeple_by_skills'
    },
    FIELDS: {
        PROJECT: 'PROJECT',
        PHONE: 'PHONE',
        CALL: 'CALL',
        MANAGER: 'MANAGER',
        DESIGNATION: 'DESIGNATION',
        ROLE: 'ROLE',
        EMAIL: 'EMAIL',
        LOCATION: 'LOCATION',
        BIRTH_DATE: 'BIRTH_DATE',
        ALTERNATIVE_EMAIL: 'ALTERNATIVE_EMAIL',
        EMP_ID: 'EMP_ID',
        EXPERIENCE: 'EXPERIENCE',
        DATE_OF_JOINING: 'DATE_OF_JOINING',
        HR: 'HR',
    },
    FIELDS_VALUES: {
        PROJECT: ['Department'],
        PHONE: ['Mobile'],
        CALL: ['Mobile'],
        MANAGER: ['Reporting_To'],
        DESIGNATION: ['Designation'],
        ROLE: ['Role'],
        EMAIL: ['EmailID'],
        LOCATION: ['LocationName'],
        BIRTH_DATE: ['Date_of_birth', 'Birth_Date_as_per_Records'],
        ALTERNATIVE_EMAIL: ['Other_Email'],
        EMP_ID: ['EmployeeID'],
        EXPERIENCE: ['Experience'],
        DATE_OF_JOINING: ['Dateofjoining'],
        FIRST_NAME: ['FirstName'],
    }
}