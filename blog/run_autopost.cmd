@echo off
cd /d "C:\Users\mvonh\Projects\gnfinsurance-landing"
claude -p "Follow the instructions in blog/autopost_task.md exactly." --dangerously-skip-permissions >> blog\autopost.log 2>&1
