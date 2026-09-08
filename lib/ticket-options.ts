export const categories = [
  "Hardware",
  "Software",
  "Network / Internet",
  "Email",
  "Printing",
  "Telephone / Communication",
  "Access / Account",
  "IT Request",
  "Security",
  "Other",
] as const;
export const priorities = ["Low", "Medium", "High", "Critical"] as const;
export const statuses = [
  "New",
  "Acknowledged",
  "Assigned",
  "In Progress",
  "Pending User",
  "Resolved",
  "Closed",
] as const;
export const filterStatuses = [...statuses, "Pending", "Completed"];
export const categoryOptions: Record<
  string,
  { label: string; options: string[] }
> = {
  Hardware: {
    label: "Device Type",
    options: [
      "Desktop PC",
      "Laptop",
      "Workstation",
      "All-in-One PC",
      "Monitor",
      "Keyboard",
      "Mouse",
      "Headphones / Headset",
      "Printer",
      "Scanner",
      "CUG Phone",
      "Mobile Phone",
      "Tablet",
      "IP Phone",
      "Conference Room Equipment",
      "Docking Station",
      "Wi-Fi Access Point",
      "Barcode Scanner",
      "POS / Payment Terminal",
      "CCTV / Security Equipment",
      "Other",
    ],
  },
  Software: {
    label: "Software/Application",
    options: [
      "Microsoft Outlook",
      "Microsoft Teams",
      "Microsoft Office / Word / Excel / PowerPoint",
      "Microsoft Dynamics",
      "Windows",
      "Adobe Acrobat",
      "Internet Browser",
      "MRC Applications",
      "Antivirus / Endpoint Security",
      "VPN",
      "POS Software",
      "Printing Software",
      "Other",
    ],
  },
  "Network / Internet": {
    label: "Issue Type",
    options: [
      "No Internet",
      "Slow Internet",
      "Wi-Fi Not Connecting",
      "Wi-Fi Slow",
      "LAN / Network Connection",
      "Network Disconnection",
      "VPN Issue",
      "Website / Internal System Not Accessible",
      "Shared Folder Access",
      "Network Drive Issue",
      "Other",
    ],
  },
  Email: {
    label: "Email Issue",
    options: [
      "Outlook Not Opening",
      "Cannot Send Email",
      "Cannot Receive Email",
      "Email Delayed",
      "Password / Login Issue",
      "Mailbox Full",
      "Shared Mailbox Access",
      "Email Configuration",
      "Mobile Email Issue",
      "Spam / Phishing Email",
      "Archived Mailbox",
      "Other",
    ],
  },
  "Access / Account": {
    label: "Access Request",
    options: [
      "Password Reset",
      "Account Locked",
      "Microsoft 365 Access",
      "Shared Folder Access",
      "Shared Mailbox Access",
      "VPN Access",
      "Application Access",
      "Printer Access",
      "Other",
    ],
  },
  "IT Request": {
    label: "IT Request Type",
    options: [
      "Software Installation",
      "Software Upgrade",
      "Printer Installation",
      "System Configuration",
      "IT Equipment Replacement",
    ],
  },
};
export function ticketReference(ticket: {
  id: number;
  created_at: string;
  reference?: string | null;
}) {
  return ticket.reference ?? `MH-${String(ticket.id).padStart(4, "0")}`;
}
