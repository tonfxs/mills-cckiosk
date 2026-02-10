import { desc } from "motion/react-client";
import { UserGuide } from "../../components/(admin)/UserGuide";
const sections = [
  {
    id: "status",
    title: "Status per transaction",
    // description: "Statuses to help you get started.",
    steps: [
        {
          title: "Pending Verification",
          description: "Default status for new entries under Order Pickup.",
        },
        {
          title: "Pending Pickup",
          description: "Default status for new entries under Item Return.",
        },
        {
          title: "Endorsed to WH",
          description: "To be selected by CS once order checking is completed, all required updates or actions have been made, and the pickup or return request has been sent to the WH Admin.",
        },
        {
          title: "Proceed to Window",
          description: "To be selected by CS when there is an issue with the order and they had called the customer to direct them to the window for further assistance.",
          desc: "CS should add a brief explanation of why the customer was directed to the window (cx can't provide correct last 4 digits of the CC / order has an owing amount / collector is not the name on order, etc).",
        },
        {
          title: "Order Collected",
          description: "To be updated by the WH Admin when a pickup order has been successfully collected by the customer.",
        },
        {
          title: "Item Received",
          description: "To be updated by the WH Admin when the drop-off item has been successfully collected by the WH Team.",
        },
      ],
    },


  {
      id: "tools",
      title: "Tools / Resources",
    //   description: "Tools and Resources to help you get started.",
      steps: [
        {
          title: "CS KP Process",
          description: "Monitor kiosk activity and orders.",
          href: "https://kbts.mytopia.com.au/cs/troubleshooter/category/4019",
          openInNewTab: true,
        },
        {
          title: "WH_Shop Orders Progress Sheet > Current Orders Tab",
          description: "Prepare and manage customer pickups.",
          href: "https://docs.google.com/spreadsheets/d/1yXKpDR9dy2pQpVCt0bmKD6B1X-lXS6tLGjgaAl2qC04/edit?gid=2086473602#gid=2086473602",
          openInNewTab: true,
        },
        {
          title: "SHOP Task Tracker",
          description: "At the end of each day, each agent should count the number of returns and pickups they handled and record them in the Shop Task Tracker. This will be counted towards their productivity report that will be sent the following day.",
          href: "https://docs.google.com/forms/d/e/1FAIpQLSeMToDBHiaeT7l45GL-sDQOx9LikXhQXwNjkVg1ItCzEoKvTA/viewform",
          openInNewTab: true,
        }
      ],
    },
  ];

export default function UserGuidePage() {
  return <UserGuide sections={sections} />;
}
