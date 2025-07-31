public with sharing class FundingApplicationController {

    @AuraEnabled(cacheable=true)
    public static List<Funding_Application__c> getFundingApplications() {
        try {
            return [
                SELECT Id, 
                       Name,
                       Application_Status__c,
                       Date__c,
                       Request_Type__c,
                       CreatedDate
                FROM Funding_Application__c 
                ORDER BY CreatedDate DESC
                LIMIT 1000
            ];
        } catch (Exception e) {
            System.debug('Error in getFundingApplications: ' + e.getMessage());
            throw new AuraHandledException('Unable to retrieve funding applications: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Funding_Application__c> getFundingApplicationsWithFilter(
        String statusFilter, 
        String requestTypeFilter, 
        Integer limitRecords, 
        Integer offsetRecords
    ) {
        try {
            String query = 'SELECT Id, Name, Application_Status__c, Date__c, Request_Type__c, CreatedDate FROM Funding_Application__c';
            String whereClause = '';
            List<String> conditions = new List<String>();
            
            if (String.isNotBlank(statusFilter) && statusFilter != 'All') {
                conditions.add('Application_Status__c = :statusFilter');
            }
            
            if (String.isNotBlank(requestTypeFilter) && requestTypeFilter != 'All') {
                conditions.add('Request_Type__c = :requestTypeFilter');
            }
            
            if (!conditions.isEmpty()) {
                whereClause = ' WHERE ' + String.join(conditions, ' AND ');
            }
            
            query += whereClause + ' ORDER BY CreatedDate DESC';
            
            if (limitRecords != null && limitRecords > 0) {
                query += ' LIMIT ' + limitRecords;
            }
            
            if (offsetRecords != null && offsetRecords > 0) {
                query += ' OFFSET ' + offsetRecords;
            }
            
            return Database.query(query);
            
        } catch (Exception e) {
            System.debug('Error in getFundingApplicationsWithFilter: ' + e.getMessage());
            throw new AuraHandledException('Unable to retrieve filtered funding applications: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getDashboardSummary() {
        try {
            Map<String, Integer> summary = new Map<String, Integer>();
            
            // Initialize counts
            summary.put('approved', 0);
            summary.put('rejected', 0);
            summary.put('revision', 0);
            summary.put('total', 0);
            
            // Get aggregated results
            List<AggregateResult> results = [
                SELECT Application_Status__c status, COUNT(Id) cnt
                FROM Funding_Application__c 
                GROUP BY Application_Status__c
            ];
            
            Integer totalCount = 0;
            
            for (AggregateResult result : results) {
                String status = (String) result.get('status');
                Integer count = (Integer) result.get('cnt');
                totalCount += count;
                
                if (status != null) {
                    String statusLower = status.toLowerCase();
                    
                    if (statusLower.contains('approved')) {
                        summary.put('approved', summary.get('approved') + count);
                    } else if (statusLower.contains('rejected')) {
                        summary.put('rejected', summary.get('rejected') + count);
                    } else if (statusLower.contains('revision')) {
                        summary.put('revision', summary.get('revision') + count);
                    }
                }
            }
            
            summary.put('total', totalCount);
            
            return summary;
            
        } catch (Exception e) {
            System.debug('Error in getDashboardSummary: ' + e.getMessage());
            throw new AuraHandledException('Unable to retrieve dashboard summary: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<String> getApplicationStatusValues() {
        try {
            List<String> statusValues = new List<String>();
            statusValues.add('All');
            
            Schema.DescribeFieldResult fieldResult = Funding_Application__c.Application_Status__c.getDescribe();
            List<Schema.PicklistEntry> picklistValues = fieldResult.getPicklistValues();
            
            for (Schema.PicklistEntry entry : picklistValues) {
                if (entry.isActive()) {
                    statusValues.add(entry.getValue());
                }
            }
            
            return statusValues;
            
        } catch (Exception e) {
            System.debug('Error in getApplicationStatusValues: ' + e.getMessage());
            throw new AuraHandledException('Unable to retrieve status values: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<String> getRequestTypeValues() {
        try {
            List<String> requestTypeValues = new List<String>();
            requestTypeValues.add('All');
            
            Schema.DescribeFieldResult fieldResult = Funding_Application__c.Request_Type__c.getDescribe();
            List<Schema.PicklistEntry> picklistValues = fieldResult.getPicklistValues();
            
            for (Schema.PicklistEntry entry : picklistValues) {
                if (entry.isActive()) {
                    requestTypeValues.add(entry.getValue());
                }
            }
            
            return requestTypeValues;
            
        } catch (Exception e) {
            System.debug('Error in getRequestTypeValues: ' + e.getMessage());
            throw new AuraHandledException('Unable to retrieve request type values: ' + e.getMessage());
        }
    }
    
    
    @AuraEnabled
    public static Boolean updateApplicationStatus(Id recordId, String newStatus) {
        try {
            Funding_Application__c app = new Funding_Application__c(
                Id = recordId,
                Application_Status__c = newStatus
            );
            
            update app;
            return true;
            
        } catch (Exception e) {
            System.debug('Error in updateApplicationStatus: ' + e.getMessage());
            throw new AuraHandledException('Unable to update application status: ' + e.getMessage());
        }
    }
}