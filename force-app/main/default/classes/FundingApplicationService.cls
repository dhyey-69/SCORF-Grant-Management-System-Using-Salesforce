public class FundingApplicationService {

    @AuraEnabled
    public static Id saveStep1(Map<String, Object> formData) {
        if (formData == null || formData.isEmpty()) {
            throw new AuraHandledException('No data received from client.');
        }

        Funding_Application__c fa = new Funding_Application__c();

        if (formData.containsKey('Request_Type__c')) fa.Request_Type__c = (String) formData.get('Request_Type__c');
        if (formData.containsKey('Does_Entity_Approve_Line_Items__c')) fa.Does_Entity_Approve_Line_Items__c = (String) formData.get('Does_Entity_Approve_Line_Items__c');
        if (formData.containsKey('Name_of_Person_Completing_Form__c')) fa.Name_of_Person_Completing_Form__c = (String) formData.get('Name_of_Person_Completing_Form__c');
        if (formData.containsKey('SCEIS_Vendor_Number__c')) fa.SCEIS_Vendor_Number__c = (String) formData.get('SCEIS_Vendor_Number__c');
        if (formData.containsKey('Entity_Type__c')) fa.Entity_Type__c = (String) formData.get('Entity_Type__c');
        if (formData.containsKey('Please_Specify_Other_Entity_Type__c')) fa.Please_Specify_Other_Entity_Type__c = (String) formData.get('Please_Specify_Other_Entity_Type__c');
        if (formData.containsKey('Collaborating_with_Other_GPS_Entity__c')) fa.Collaborating_with_Other_GPS_Entity__c = (String) formData.get('Collaborating_with_Other_GPS_Entity__c');
        if (formData.containsKey('Please_select_the_appropriate_county__c')) fa.Please_select_the_appropriate_county__c = (String) formData.get('Please_select_the_appropriate_county__c');
        if (formData.containsKey('Is_Entity_an_SC_Bellwether_Plaintiff__c')) fa.Is_Entity_an_SC_Bellwether_Plaintiff__c = (String) formData.get('Is_Entity_an_SC_Bellwether_Plaintiff__c');
        if (formData.containsKey('Was_Entity_a_Litigating_Subdivision__c')) fa.Was_Entity_a_Litigating_Subdivision__c = (String) formData.get('Was_Entity_a_Litigating_Subdivision__c');
        if (formData.containsKey('Any_Potential_Conflict_with_SC_Recovery__c')) fa.Any_Potential_Conflict_with_SC_Recovery__c = (String) formData.get('Any_Potential_Conflict_with_SC_Recovery__c');
        if (formData.containsKey('Identify_the_Board_member_and_Relation__c')) fa.Identify_the_Board_member_and_Relation__c = (String) formData.get('Identify_the_Board_member_and_Relation__c');

        // Payment Remit To (SCEIS)
        if (formData.containsKey('Address_Line_1_SCEIS__c')) fa.Address_Line_1_SCEIS__c = (String) formData.get('Address_Line_1_SCEIS__c');
        if (formData.containsKey('Address_Line_2_SCEIS__c')) fa.Address_Line_2_SCEIS__c = (String) formData.get('Address_Line_2_SCEIS__c');
        if (formData.containsKey('City_SCEIS__c')) fa.City_SCEIS__c = (String) formData.get('City_SCEIS__c');
        if (formData.containsKey('State_SCEIS__c')) fa.State_SCEIS__c = (String) formData.get('State_SCEIS__c');
        if (formData.containsKey('Zip_SCEIS__c')) fa.Zip_SCEIS__c = (String) formData.get('Zip_SCEIS__c');

        // Political Subdivision Address
        if (formData.containsKey('Address_Line_1_PSA__c')) fa.Address_Line_1_PSA__c = (String) formData.get('Address_Line_1_PSA__c');
        if (formData.containsKey('Address_Line_2_PSA__c')) fa.Address_Line_2_PSA__c = (String) formData.get('Address_Line_2_PSA__c');
        if (formData.containsKey('City_PSA__c')) fa.City_PSA__c = (String) formData.get('City_PSA__c');
        if (formData.containsKey('State_PSA__c')) fa.State_PSA__c = (String) formData.get('State_PSA__c');
        if (formData.containsKey('Zip_PSA__c')) fa.Zip_PSA__c = (String) formData.get('Zip_PSA__c');

        // POCs
        if (formData.containsKey('Program_Manager_Name__c')) fa.Program_Manager_Name__c = (String) formData.get('Program_Manager_Name__c');
        if (formData.containsKey('Program_Manager_Email__c')) fa.Program_Manager_Email__c = (String) formData.get('Program_Manager_Email__c');
        if (formData.containsKey('Program_Manager_Phone_Number__c')) fa.Program_Manager_Phone_Number__c = (String) formData.get('Program_Manager_Phone_Number__c');
        if (formData.containsKey('Fiscal_Manager_Title__c')) fa.Fiscal_Manager_Title__c = (String) formData.get('Fiscal_Manager_Title__c');
        if (formData.containsKey('Fiscal_Manager_Email__c')) fa.Fiscal_Manager_Email__c = (String) formData.get('Fiscal_Manager_Email__c');
        if (formData.containsKey('Fiscal_Manager_Phone_Number__c')) fa.Fiscal_Manager_Phone_Number__c = (String) formData.get('Fiscal_Manager_Phone_Number__c');

        insert fa;

        // File Upload using ContentVersion
        if (formData.containsKey('authorizationLetterBase64') && String.isNotBlank((String) formData.get('authorizationLetterBase64'))) {
            ContentVersion cv = new ContentVersion();

            // Get and sanitize file name
            String fileName = (String) formData.get('authorizationLetterName');
            if (String.isBlank(fileName)) fileName = 'Authorization_Letter.pdf';
            String title = fileName.endsWith('.pdf') ? fileName.substring(0, fileName.length() - 4) : fileName;

            cv.Title = title;
            cv.PathOnClient = fileName;
            cv.VersionData = EncodingUtil.base64Decode((String) formData.get('authorizationLetterBase64'));
            insert cv;

            // Link file to Funding Application
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id].ContentDocumentId;
            cdl.LinkedEntityId = fa.Id;
            cdl.ShareType = 'V';  
            cdl.Visibility = 'AllUsers';
            insert cdl;
        }

        return fa.Id;
    }
}