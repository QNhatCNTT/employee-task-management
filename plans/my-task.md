Introduction
Create an application that includes front-end, a back-end, and database (Firebase). Use the code editor of your choice.

Before you begin, make sure to sign up for free accounts on these services:
firebase (https://firebase.google.com) (for database)
twilio (https://www.twilio.com) or sms api of your choice (ex: sms.to)  (for texting)

Front-end

Project: Real-Time Employee Task Management Tool
Overview:
Develop a real-time employee task management tool that enables managers to efficiently manage tasks assigned to employees, track progress, and dynamically update task status. The application should support user authentication, employee management, task creation, assignment, and real-time updates for all connected users.
Key Features:
1. User Authentication:
   * Implement secure user authentication (login/logout) system for managers and employees.
   * Managers should have access to additional features like employee management and task assignment.
2. Employee Management:
   * Allow managers to add, edit, and remove employees from the system.
   * Each employee should have a profile with details such as name, role, and assigned tasks.
3. Real time Message
   * Allow managers to chat with employees.


To create the front-end, follow these initial steps

Step 1: Use the Create-React-App (https://github.com/facebook/create-react-app) to create a skeleton React project.  (You are also welcome to set up the app using Next.js or Vite instead of Create-React-App.)

Role Owner:

Step 2: Create a form that includes two input fields (phone number and access code). These fields don't have to be fancy, no styling is acceptable.

The idea is for the user to enter their phone number in the first input field and submit. The back-end will generate a random 6-digit access code that is then saved to the provided phone number already stored in the database. Once saved, the access code is sent to the phone number via text message.


Step 3: The customer receives the access code via text and enters it to the second input field. The front-end now needs to validate that access code by calling the back-end. If the code matches with the access code saved in the database, then return a success message to the front end and save the phone number to the front end local storage.


Step 4 will be transitioning to the employee management dashboard. Here, users can add, delete, and edit employee details and set work schedules. When creating a new employee, an email will be sent to them with their account credentials so they can log in.
For the employee management dashboard:
* Users can view a list of employees with their details (name, contact information, role, etc.).
* Users can add a new employee by filling out a form with required details like name, phone number, email, and role. Upon submission, an email will be sent to the new employee's email address containing login credentials.
* Users can delete an existing employee from the list.
* Users can edit employee details such as their contact information or role.
* Users can set work schedules for employees, specifying work hours and days.
The front-end should facilitate these actions and communicate with the back-end to perform CRUD operations (Create, Read, Update, Delete) on employee data stored in the database. When adding a new employee, integrate an email service to send account details securely to the employee's email address. This ensures a seamless experience for managing employee information and schedules within the application.


Step 5 
Owner can chat with each created employee. Use socket.io to chat realtime. 

Role Employee

For the employee role setup, the first step would involve the employee receiving an email containing a link to set up their account credentials. Here's a breakdown of how this process can be implemented:
1. Email Verification and Account Setup:
   * When a new employee is added to the system (as described in Step 4), an automated email should be sent to the employee's provided email address.
   * This email should contain a unique verification link that the employee needs to click on to set up their account.
   * The link should direct the employee to a secure page within your application.
2. Secure Account Setup Page:
   * The verification link should lead the employee to a dedicated page in your application where they can set up their account credentials (username and password).
   * This page should include input fields for the employee to enter their desired username and password.
3. Handling Account Setup:
   * Once the employee submits their chosen username and password, your backend should handle the request to set up the employee's account.
   * This involves securely storing the credentials associated with the employee's profile in your database.
4. Authentication and Login:
   * After successfully setting up their account, the employee should be redirected to the login page of your application.
   * The employee can then use their newly created credentials (username and password) to log in securely.
5. Security Measures:
   * Implement security best practices such as using HTTPS for all communication, securely hashing passwords before storing them in the database, and validating email addresses to prevent unauthorized account setup.
   * Consider using token-based authentication (e.g., JSON Web Tokens - JWT) to manage authenticated sessions and secure API requests.
By following these steps, you can ensure that the process of setting up employee accounts and enabling them to log in securely to your application is smooth and secure. This initial setup lays the foundation for effective employee role management within your system.

Once employees have logged into the system, they can manage their assigned tasks and update their profile information. When completing a task, employees can mark it as done by clicking a "Done" button.
To implement this feature, you can follow these steps:

1. Profile Editing:
   * Provide employees with the ability to edit their profile information, such as name, phone number, email address, etc.
   * Allow employees to save changes made to their profile.




Back-end
You must create an Express backend. Follow this simple tutorial to start one within 5 minutes (https://medium.com/@onejohi/building-a-simple-rest-api-with-nodejs-and-express-da6273ed7ca9)

You can create as many functions in the back-end as you want, but the back-end must have these functions:

Role Owner:


(POST) CreateNewAccessCode
Parameters: phoneNumber
Return: a random 6-digit access code
Other requirement: save this access code to the phoneNumber in the database


(POST) ValidateAccessCode
Parameters: accessCode, phoneNumber
Return: { success: true }
Other requirement: set the access code to empty string once validation is complete


(POST) GetEmployee
Parameters: employeeId
Return: Employee object
Other requirement: Retrieves employee details based on the provided employeeId.


(POST) CreateEmployee
Parameters: name, email, department
Return: { success: true, employeeId: "generated_id" }
Other requirement: Creates a new employee record with the given details and returns a success message along with the generated employeeId.


(POST) DeleteEmployee
Parameters: employeeId
Return: { success: true }
Other requirement: Deletes the employee record associated with the given employeeId and returns a success message upon completion.


Employee Role Endpoints:
(POST) LoginEmail
Parameters: email
Return: a random 6-digit access code
Other requirement: save this access code to the code in the database and send code to email


(POST) ValidateAccessCode
Parameters: accessCode, email
Return: { success: true }
Other requirement: set the access code to empty string once validation is complete


Submission
You must include these items in the repo:
1. README file explaining how the project is structured and how to run it.
2. Screenshots of your application