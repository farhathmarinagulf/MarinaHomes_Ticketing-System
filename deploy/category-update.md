# IT category form update

Based on Category.pdf supplied on 7 September 2026. The explicit requested layout takes precedence over the PDF's suggested order: IT Category and Priority share the first field row; Subject is the second. Category-specific selectors and Other notes follow Subject.

Includes all ten categories, the PDF's Hardware, Software, Network / Internet, Email, Access / Account and IT Request options, and Critical priority. Printing, Telephone / Communication and Security use the existing description field because the PDF supplies no secondary list for them. Other selections require a note, stored separately and visible in the ticket details to the owner and admins.

New tickets use New → Acknowledged → Assigned → In Progress → Pending User → Resolved → Closed status options. Admins choose the appropriate status; transitions are not forced to be sequential. Existing Pending and Completed records remain readable and filterable. New references use IT-YYYY-00001 with the Dubai creation year and database sequence; the sequence does not reset annually. Existing MH references are preserved.

After copying the updated source to the hosting laptop, run:

```powershell
docker compose up -d --build
```

The startup migration adds the fields and expands priority/status constraints without deleting existing tickets. Preserve the host's .env file and database volume. The deployment must finish its migration before the new app starts. Do not use `docker compose down -v`.
