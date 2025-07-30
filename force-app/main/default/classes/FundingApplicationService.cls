public class FundingApplicationService {

    @AuraEnabled
    public static Id saveStep1(Map<String, Object> formData) {
        if (formData == null || formData.isEmpty()) {
            throw new AuraHandledException('No data received from client.');
        }

        Funding_Application__c fa = (Funding_Application__c) JSON.deserialize(JSON.serialize(formData), Funding_Application__c.class);

        fa.Application_Status__c = 'Draft';
        insert fa;

        // Optional: Handle file
        try {
            if (formData.containsKey('authorizationLetterBase64') && String.isNotBlank((String) formData.get('authorizationLetterBase64'))) {
                String fileName = (String) formData.get('authorizationLetterName');
                if (String.isBlank(fileName)) fileName = 'Authorization_Letter.pdf';
                String title = fileName.endsWith('.pdf') ? fileName.substring(0, fileName.length() - 4) : fileName;

                ContentVersion cv = new ContentVersion();
                cv.Title = title;
                cv.PathOnClient = fileName;
                cv.VersionData = EncodingUtil.base64Decode((String) formData.get('authorizationLetterBase64'));
                insert cv;

                cv = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1];

                ContentDocumentLink cdl = new ContentDocumentLink();
                cdl.LinkedEntityId = fa.Id;
                cdl.ContentDocumentId = cv.ContentDocumentId;
                cdl.ShareType = 'V';
                cdl.Visibility = 'AllUsers';
                insert cdl;
            }
        } catch (Exception ex) {
            throw new AuraHandledException('File upload failed: ' + ex.getMessage());
        }

        return fa.Id;
    }

}