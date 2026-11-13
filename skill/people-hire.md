---
name: people-hire
title: Hiring an employee
description: Use when an HR officer asks to hire someone, add a new employee, start an employment, or turn an accepted offer into a hire in People.
kind: procedure
aliases: [hire, new hire, new employee, add employee, onboard employee, start employment, take on, rehire, hire from offer]
screens: [/qapps/People/Employees/HireEmployee, /qapps/People/Employees/HireEmployee/Identity, /qapps/People/Employees/HireEmployee/EmploymentTerms, /qapps/People/Employees/HireEmployee/ConfirmHire, /qapps/People/Staffing/OfferDetail]
risk: confirm
---
A hire is made in People's Hire employee wizard, as the signed-in HR officer: People checks again at every step that they
may hire for the employer (an HR editor of it). It has three steps, Identity, Employment terms and Confirm hire, and keeps a
draft as it goes, so nothing is made until Hire on the last step. Never ask for or write pay, a salary, a bank account, an
identity number or a home address: pay is payroll's, set later on the person's pay assignment, and private details are the
person's own in their self-service.

## Steps
1. Ask for the employer, the person's name and work email, the start date and, if known, the department, position,
   manager and work location. An accepted offer already carries these: open it (`screen go=/qapps/People/Staffing/OfferDetail?employmentOfferId=<the offer>`)
   and use its Hire, which starts the wizard from the offer.
2. `screen go=/qapps/People/Employees/HireEmployee/Identity` and `set` Employer. Search for the person first: when one of
   the people offered is them (a former employee, an applicant, someone employed elsewhere), choose them, so no second
   person is made. Only otherwise `set` First name, Last name and Work email and confirm a new person.
3. Next. On Employment terms `set` Starts (and Ends only for a fixed term), Department, Position, Manager and Work location
   from their drop-downs; only what the employer has is offered.
4. Next. Confirm hire shows the plan and anything to settle first (a person already employed there, a seat taken, a
   manager who is not an employee). Read the findings to the user; an account request proposes IronStone BOSS users and
   employee self-service, which the user may leave or change.
5. Do not press Hire. Tell the user the hire is ready to review and that they press Hire themselves.

## After
Hire opens the person's Employee360: their onboarding checklist starts and, when asked, Admin receives the account request.
Payroll sets their pay assignment from Payroll › Pay assignments; their leave allocation and working schedule follow the
employer's policies.
