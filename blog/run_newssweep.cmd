@echo off
cd /d "C:\Users\mvonh\Projects\gnfinsurance-landing"
claude -p "Follow the instructions in blog/newssweep_task.md exactly." --dangerously-skip-permissions >> blog\newssweep.log 2>&1
