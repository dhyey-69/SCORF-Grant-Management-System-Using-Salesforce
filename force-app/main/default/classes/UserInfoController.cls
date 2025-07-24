public with sharing class UserInfoController {
    public class UserDTO {
        @AuraEnabled public String name;
        @AuraEnabled public String email;
        @AuraEnabled public String phone;
    }

    @AuraEnabled(cacheable=true)
    public static UserDTO getUserInfo() {
        User currentUser = [
            SELECT Name, Username, Phone
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        UserDTO dto = new UserDTO();
        dto.name = currentUser.Name;
        dto.email = currentUser.Username;
        dto.phone = currentUser.Phone;
        return dto;
    }
}