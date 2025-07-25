public with sharing class GpsformController {

    public class PicklistOption {
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public String value { get; set; }

        public PicklistOption(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, List<PicklistOption>> getAbatementStrategyPicklists() {
        Map<String, List<PicklistOption>> picklistMap = new Map<String, List<PicklistOption>>();

        try {
            Schema.SObjectType objectType = Schema.getGlobalDescribe().get('Abatement_Strategy__c');
            if (objectType == null) {
                throw new AuraHandledException('Abatement_Strategy__c object not found.');
            }

            Map<String, Schema.SObjectField> fieldsMap = objectType.getDescribe().fields.getMap();

            String parentField = 'Core_Strategies__c';
            String childField = 'Core_Abatement_Strategies__c';

            if (fieldsMap.containsKey(parentField)) {
                List<PicklistOption> parentOptions = new List<PicklistOption>();
                for (Schema.PicklistEntry entry : fieldsMap.get(parentField).getDescribe().getPicklistValues()) {
                    if (entry.isActive()) {
                        parentOptions.add(new PicklistOption(entry.getLabel(), entry.getValue()));
                    }
                }
                picklistMap.put(parentField, parentOptions);
            }

            if (fieldsMap.containsKey(childField)) {
                List<PicklistOption> childOptions = new List<PicklistOption>();
                for (Schema.PicklistEntry entry : fieldsMap.get(childField).getDescribe().getPicklistValues()) {
                    if (entry.isActive()) {
                        childOptions.add(new PicklistOption(entry.getLabel(), entry.getValue()));
                    }
                }
                picklistMap.put(childField, childOptions);
            }

        } catch (Exception e) {
            throw new AuraHandledException('Error fetching picklist data: ' + e.getMessage());
        }

        return picklistMap;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, List<PicklistOption>> getFundingAppPicklists() {
        Map<String, List<PicklistOption>> picklistMap = new Map<String, List<PicklistOption>>();
        Schema.SObjectType objectType = Schema.getGlobalDescribe().get('Funding_Application__c');

        if (objectType == null) {
            throw new AuraHandledException('Funding_Application__c object not found.');
        }

        Map<String, Schema.SObjectField> fieldsMap = objectType.getDescribe().fields.getMap();

        for (String fieldName : new List<String>{ 
            'Request_Type__c', 
            'Entity_Type__c',
            'Please_select_the_appropriate_county__c',
            'State_PSA__c' ,
            'State_SCEIS__c'
        }) {
            if (fieldsMap.containsKey(fieldName)) {
                List<PicklistOption> options = new List<PicklistOption>();
                for (Schema.PicklistEntry entry : fieldsMap.get(fieldName).getDescribe().getPicklistValues()) {
                    if (entry.isActive()) {
                        options.add(new PicklistOption(entry.getLabel(), entry.getValue()));
                    }
                }
                picklistMap.put(fieldName, options);
            }
        }

        return picklistMap;
    }

}