public with sharing class FundingApplicationService {

    @AuraEnabled
    public static Id saveStep1(Map<String, Object> formData, List<Map<String,Object>> coreStrategies) {
        if (formData == null || formData.isEmpty()) {
            throw new AuraHandledException('No data received from client.');
        }

        // 1️⃣ Insert Funding Application
        Funding_Application__c fa = 
            (Funding_Application__c) JSON.deserialize(JSON.serialize(formData), Funding_Application__c.class);
        fa.Application_Status__c = 'Draft';
        insert fa;

        // 2️⃣ Insert Abatement Strategy
        Abatement_Strategy__c abatement = 
            (Abatement_Strategy__c) JSON.deserialize(JSON.serialize(formData), Abatement_Strategy__c.class);
        abatement.Funding_Application__c = fa.Id;
        insert abatement;

        // 3️⃣ Handle File Upload (if present)
        handleFileUpload(formData, fa.Id);

        // 4️⃣ Insert Child Records from coreStrategies
        if (coreStrategies != null && !coreStrategies.isEmpty()) {
            insertChildRecords(coreStrategies, abatement.Id);
        }

        return fa.Id;
    }

    private static void handleFileUpload(Map<String, Object> formData, Id parentId) {
        if (!formData.containsKey('authorizationLetterBase64')) return;

        String base64File = (String) formData.get('authorizationLetterBase64');
        if (String.isBlank(base64File)) return;

        String fileName = (String) formData.get('authorizationLetterName');
        if (String.isBlank(fileName)) fileName = 'Authorization_Letter.pdf';
        String title = fileName.endsWith('.pdf') ? 
            fileName.substring(0, fileName.length() - 4) : fileName;

        ContentVersion cv = new ContentVersion();
        cv.Title = title;
        cv.PathOnClient = fileName;
        cv.VersionData = EncodingUtil.base64Decode(base64File);
        insert cv;

        ContentDocumentLink cdl = new ContentDocumentLink();
        cdl.LinkedEntityId = parentId;
        cdl.ContentDocumentId = [
            SELECT ContentDocumentId 
            FROM ContentVersion 
            WHERE Id = :cv.Id LIMIT 1
        ].ContentDocumentId;
        cdl.ShareType = 'V';
        cdl.Visibility = 'AllUsers';
        insert cdl;
    }

    private static void insertChildRecords(List<Map<String,Object>> coreStrategies, Id abatementId) {
        // ⚡ Get record types for Strategy_Resource__c
        Map<String, Schema.RecordTypeInfo> rtMap = Strategy_Resource__c.SObjectType.getDescribe().getRecordTypeInfosByName();
        Id personnelRT = rtMap.get('Personal').getRecordTypeId();
        Id budgetRT = rtMap.get('Budget').getRecordTypeId();

        List<Strategy__c> strategyList = new List<Strategy__c>();
        List<Strategy_Resource__c> resourceList = new List<Strategy_Resource__c>();

        for (Map<String,Object> coreMap : coreStrategies) {
            List<Object> subStrategies = (List<Object>) coreMap.get('subStrategies');
            if (subStrategies == null) continue;

            for (Object sub : subStrategies) {
                Map<Object,Object> rawMap = (Map<Object,Object>) sub;

                // Convert to Map<String,Object>
                Map<String,Object> subMap = new Map<String,Object>();
                for (Object key : rawMap.keySet()) {
                    subMap.put((String) key, rawMap.get(key));
                }

                // 🔹 Extract the SubStrategy label/value
                String subStrategyName = (String) subMap.get('value'); 
                // 👆 That’s the one you want to store

                // 🔹 Strategy__c creation
                Strategy__c strat = new Strategy__c();
                strat.Abatement_Strategy__c = abatementId;
                strat.Abatement_Strategy_Name__c = subStrategyName;  // ✅ store here
                strat.Budget_Amount_for_the_Purchase__c = parseDecimal(subMap.get('Budget_Amount_for_the_Purchase__c'));
                strat.Status__c = 'Submitted';
                strat.Is_your_Strategy_Initial_Continuation__c = (String) subMap.get('Is_your_Strategy_Initial_Continuation__c');
                strat.Budget_Narrative__c = (String) subMap.get('Budget_Narrative__c');
                strat.Implementation_plan_for_the_Strategy__c = (String) subMap.get('Implementation_plan_for_the_Strategy__c');
                strat.Provide_the_Outcome_Measures__c = (String) subMap.get('Provide_the_Outcome_Measures__c');
                strat.Provide_the_Process_Measures__c = (String) subMap.get('Provide_the_Process_Measures__c');
                strategyList.add(strat);

                // 🔹 Handle personnel list
                List<Object> personnelList = (List<Object>) subMap.get('personnelList');
                if (personnelList != null) {
                    for (Object p : personnelList) {
                        Map<Object,Object> rawPerson = (Map<Object,Object>) p;
                        Map<String,Object> person = new Map<String,Object>();
                        for (Object key : rawPerson.keySet()) {
                            person.put((String) key, rawPerson.get(key));
                        }

                        Strategy_Resource__c res = new Strategy_Resource__c();
                        res.RecordTypeId = personnelRT;
                        res.Abatement_Strategy__c = abatementId;
                        res.Abatement_Strategy_Name__c = subStrategyName; // ✅ store here
                        res.Personnel_Name__c = (String) person.get('Personnel_Name__c');
                        res.Personnel_Position__c = (String) person.get('Personnel_Position__c');
                        res.Personnel_Key_Staff_Annual_Salary__c = parseDecimal(person.get('Personnel_Key_Staff_Annual_Salary__c'));
                        res.Personnel_Level_of_Effort__c = (String) person.get('Personnel_Level_of_Effort__c');
                        res.Personnel_Total_Charged_to_Award__c = parseDecimal(person.get('Personnel_Total_Charged_to_Award__c'));
                        resourceList.add(res);
                    }
                }

                // 🔹 Handle budget list
                List<Object> budgetList = (List<Object>) subMap.get('budgetList');
                if (budgetList != null) {
                    for (Object b : budgetList) {
                        Map<Object,Object> rawBudget = (Map<Object,Object>) b;
                        Map<String,Object> item = new Map<String,Object>();
                        for (Object key : rawBudget.keySet()) {
                            item.put((String) key, rawBudget.get(key));
                        }

                        Strategy_Resource__c res = new Strategy_Resource__c();
                        res.RecordTypeId = budgetRT;
                        res.Abatement_Strategy__c = abatementId;
                        res.Abatement_Strategy_Name__c = subStrategyName; // ✅ store here
                        res.Budget_Item__c = (String) item.get('Budget_Item__c');
                        res.Budget_Purpose__c = (String) item.get('Budget_Purpose__c');
                        res.Budget_Calculation__c = (String) item.get('Budget_Calculation__c');
                        res.Budget_Total_Charged_to_Award__c = parseDecimal(item.get('Budget_Total_Charged_to_Award__c'));
                        resourceList.add(res);
                    }
                }
            }
        }

        if (!strategyList.isEmpty()) insert strategyList;
        if (!resourceList.isEmpty()) insert resourceList;
    }



    private static Decimal parseDecimal(Object val) {
        if (val == null) return null;
        try { return Decimal.valueOf(String.valueOf(val)); }
        catch (Exception e) { return null; }
    }
}