$UserPoolId = "ap-southeast-1_VuB38lTks"

Write-Host "Creating groups..."
aws cognito-idp create-group --user-pool-id $UserPoolId --group-name "Admin" --description "Administrator group" 2>$null
aws cognito-idp create-group --user-pool-id $UserPoolId --group-name "Staff" --description "Staff group" 2>$null
aws cognito-idp create-group --user-pool-id $UserPoolId --group-name "Customer" --description "Customer group" 2>$null

# Helper function to create and set up user
function Create-CognitoUser {
    param (
        [string]$Email,
        [string]$Password,
        [string]$Name,
        [string]$Group
    )
    Write-Host "Creating user $Email..."
    aws cognito-idp admin-create-user --user-pool-id $UserPoolId --username $Email --user-attributes Name=email,Value=$Email Name=email_verified,Value=true Name=name,Value=$Name --message-action SUPPRESS
    
    Write-Host "Setting password for $Email..."
    aws cognito-idp admin-set-user-password --user-pool-id $UserPoolId --username $Email --password $Password --permanent
    
    Write-Host "Adding $Email to group $Group..."
    aws cognito-idp admin-add-user-to-group --user-pool-id $UserPoolId --username $Email --group-name $Group
}

Create-CognitoUser -Email "admin@musicstore.com" -Password "AdminPassword@123" -Name "Quan tri vien" -Group "Admin"
Create-CognitoUser -Email "staff@musicstore.com" -Password "StaffPassword@123" -Name "Nhan vien" -Group "Staff"
Create-CognitoUser -Email "customer@musicstore.com" -Password "CustomerPassword@123" -Name "Khach hang" -Group "Customer"

Write-Host "Done!"
