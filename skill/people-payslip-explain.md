---
name: people-payslip-explain
title: Explaining a payslip
description: Use when the user asks about their own payslip: a line, how their pay was worked out, why it changed, what a correction changed, or the year to date.
kind: procedure
aliases: [payslip, pay slip, salary slip, pay stub, wage slip, my pay, net pay, gross pay, deductions, why was my pay, year to date, ytd, pay correction]
screens: [/qapps/People/MyPayslip, /qapps/Commons/People/MyPayslip, /qapps/People/SelfService, /qapps/Commons/People/SelfService]
risk: reversible
---
A payslip is read from People's payroll as the signed-in user: the `people_my_payslip` tool answers their own issued payslips
alone (the latest, or the one a `payslipId` names; pass `forTool` true). It only reads. A payslip the employer has not issued is
not theirs to read yet, and nobody else's payslip is answered: never guess a number the tool did not give, and say so when the
tool finds none.

## Explain a payslip
1. Call `people_my_payslip` (with the page's `payslipId` on a payslip's page).
2. Go line by line, by group: earnings, then deductions (with the localization's employee items), then what the employer pays.
   Each line's explanation says how it was worked out: the formula and its values, a part period's proration ("16/31
   calendar days"), adjustments added and the rounding to the currency. Say it in plain words, not as a formula.
3. Net is gross less deductions and the localization's employee items. Employer cost is what the employer pays on top of
   gross; it is not taken from the employee's pay.
4. The year to date counts the year's issued pay up to this payslip's pay date, this one included.

## A correction
A correction is a payslip of its own linked to the original: its lines are the change (what was paid before and what is
due now), and the original stays as it was. The net effect is the original's net plus its corrections'. A negative change is
an overpayment to recover.

## After
Say what the net was and the one or two lines that explain most of it, or what changed from the original. Questions about a
rule, a missing hour or a correction go to payroll; the person cannot change a payslip.
