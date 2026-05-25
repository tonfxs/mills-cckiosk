// import { NextRequest, NextResponse } from "next/server";
// import nodemailer from "nodemailer";

// export async function POST(req: NextRequest) {
//   try {
//     if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD || !process.env.FRESHDESK_EMAIL) {
//       console.error("Missing email env vars:", {
//         MAIL_USER: !!process.env.MAIL_USER,
//         MAIL_PASSWORD: !!process.env.MAIL_PASSWORD,
//         FRESHDESK_EMAIL: !!process.env.FRESHDESK_EMAIL,
//       });
//       return NextResponse.json({ success: false, error: "Email service not configured" }, { status: 500 });
//     }

//     const body = await req.json();
//     const isReturn = body.formType === "return";

//     // const transporter = nodemailer.createTransport({
//     //   host: "smtp.gmail.com",
//     //   port: 465,
//     //   secure: true,
//     //   auth: {
//     //     user: process.env.MAIL_USER,
//     //     pass: process.env.MAIL_PASSWORD,
//     //   },
//     // });

//     const transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 587,        // ← change from 465
//       secure: false,    // ← change from true (587 uses STARTTLS, not SSL)
//       auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASSWORD,
//       },
//     });

//     // await transporter.verify();

//     const submittedAt = new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" });

//     // ─── PICKUP EMAIL ────────────────────────────────────────────────────────
//     const pickupHtml = () => {
//       const paymentLabel = body.paymentMethod?.replace(/-/g, " ") ?? "N/A";
//       const idLabel = body.validId?.replace(/-/g, " ") ?? "N/A";
//       const needsCardVerification = ["credit card", "debit card"].includes(paymentLabel);

//       return `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <div style="background: #2563eb; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
//             <h1 style="margin: 0; font-size: 24px;">Mills Brands Click & Collect</h1>
//             <p style="margin: 4px 0 0; opacity: 0.85;">New Pickup Order Submitted</p>
//           </div>

//           <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
//             <table style="width: 100%; border-collapse: collapse;">
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151; width: 40%;">Order Number(s)</td>
//                 <td style="padding: 12px 8px; color: #111827;">${body.orderNumber ?? "N/A"}</td>
//               </tr>
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Full Name</td>
//                 <td style="padding: 12px 8px; color: #111827;">${body.firstName ?? ""} ${body.lastName ?? ""}</td>
//               </tr>
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Phone Number</td>
//                 <td style="padding: 12px 8px; color: #111827;">+61 ${body.phone ?? "N/A"}</td>
//               </tr>
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Valid ID</td>
//                 <td style="padding: 12px 8px; color: #111827; text-transform: capitalize;">${idLabel}</td>
//               </tr>
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Payment Method</td>
//                 <td style="padding: 12px 8px; color: #111827; text-transform: capitalize;">${paymentLabel}</td>
//               </tr>
//               ${needsCardVerification ? `
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Card Last 4 Digits</td>
//                 <td style="padding: 12px 8px; color: #111827;">**** **** **** ${body.creditCard ?? "N/A"}</td>
//               </tr>` : ""}
//               <tr>
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Car Park Bay</td>
//                 <td style="padding: 12px 8px; color: #111827;">${body.carParkBay ?? "N/A"}</td>
//               </tr>
//             </table>
//           </div>

//           <div style="background: #fefce8; border: 1px solid #fde047; padding: 16px 24px;">
//             <p style="margin: 0; color: #854d0e; font-size: 14px;">
//               <strong>Note:</strong> ${needsCardVerification
//                 ? "Payment and valid ID verification required — ensure details match the name on the order."
//                 : "Please verify the customer's valid ID before releasing the order."}
//             </p>
//           </div>

//           <div style="background: #e5e7eb; padding: 16px 24px; border-radius: 0 0 8px 8px; text-align: center;">
//             <p style="margin: 0; color: #6b7280; font-size: 12px;">
//               Submitted at: ${submittedAt} &nbsp;|&nbsp; Mills Brands Click & Collect Kiosk
//             </p>
//           </div>
//         </div>
//       `;
//     };

//     // ─── RETURN EMAIL ─────────────────────────────────────────────────────────
//     const returnHtml = () => {
//       const rmaList = body.rmaID
//         ?.split(",")
//         .map((r: string) => r.trim())
//         .filter(Boolean) ?? [];
//       const multipleRmas = rmaList.length > 1;
//       const hasPaperwork = body.hasRmaPaperwork === true || body.hasRmaPaperwork === "true";

//       return `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <div style="background: #2563eb; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
//             <h1 style="margin: 0; font-size: 24px;">Mills Brands Click & Collect</h1>
//             <p style="margin: 4px 0 0; opacity: 0.85;">New Return Order Submitted</p>
//           </div>

//           <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
//             <table style="width: 100%; border-collapse: collapse;">
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151; width: 40%;">
//                   RMA ID${multipleRmas ? "s" : ""}
//                 </td>
//                 <td style="padding: 12px 8px; color: #111827;">
//                   ${multipleRmas
//                     ? `<ul style="margin: 0; padding-left: 16px;">
//                         ${rmaList.map((r: string) => `<li>${r}</li>`).join("")}
//                       </ul>`
//                     : rmaList[0] ?? "N/A"
//                   }
//                 </td>
//               </tr>
//               ${multipleRmas ? `
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Total Returns</td>
//                 <td style="padding: 12px 8px; color: #111827;">${rmaList.length} items</td>
//               </tr>` : ""}
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Full Name</td>
//                 <td style="padding: 12px 8px; color: #111827;">${body.firstName ?? ""} ${body.lastName ?? ""}</td>
//               </tr>
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Phone Number</td>
//                 <td style="padding: 12px 8px; color: #111827;">+61 ${body.phone ?? "N/A"}</td>
//               </tr>
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">RMA Paperwork</td>
//                 <td style="padding: 12px 8px; color: ${hasPaperwork ? "#16a34a" : "#dc2626"}; font-weight: bold;">
//                   ${hasPaperwork ? "Paperwork Provided" : "No Paperwork"}
//                 </td>
//               </tr>
//               <tr>
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Car Park Bay</td>
//                 <td style="padding: 12px 8px; color: #111827;">${body.carParkBay ?? "N/A"}</td>
//               </tr>
//             </table>
//           </div>

//           ${!hasPaperwork ? `
//           <div style="background: #fefce8; border: 1px solid #fde047; padding: 16px 24px;">
//             <p style="margin: 0; color: #854d0e; font-size: 14px;">
//               <strong>Action Required:</strong> Customer has no RMA paperwork. Please call the customer to the window once paperwork is ready.
//             </p>
//           </div>` : ""}

//           <div style="background: #e5e7eb; padding: 16px 24px; border-radius: 0 0 8px 8px; text-align: center;">
//             <p style="margin: 0; color: #6b7280; font-size: 12px;">
//               Submitted at: ${submittedAt} &nbsp;|&nbsp; Mills Brands Click & Collect Kiosk
//             </p>
//           </div>
//         </div>
//       `;
//     };

//     await transporter.sendMail({
//       from: `"Mills Brands Kiosk" <${process.env.MAIL_USER}>`,
//       to: process.env.FRESHDESK_EMAIL,
//       subject: isReturn
//         ? `Kiosk Return Order - ${body.rmaID ?? "New Submission"}`
//         : `Kiosk Pickup Order - ${body.orderNumber ?? "New Submission"}`,
//       html: isReturn ? returnHtml() : pickupHtml(),
//     });

//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     console.error("Email send error:", error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }






import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD || !process.env.FRESHDESK_EMAIL) {
      console.error("Missing email env vars:", {
        MAIL_USER: !!process.env.MAIL_USER,
        MAIL_PASSWORD: !!process.env.MAIL_PASSWORD,
        FRESHDESK_EMAIL: !!process.env.FRESHDESK_EMAIL,
      });
      return NextResponse.json({ success: false, error: "Email service not configured" }, { status: 500 });
    }

    const body = await req.json();
    const isReturn = body.formType === "return";
    const isProductEnquiry = body.formType === "product-enquiry";

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const submittedAt = new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" });

    // ─── PICKUP EMAIL ────────────────────────────────────────────────────────
    const pickupHtml = () => {
      const paymentLabel = body.paymentMethod?.replace(/-/g, " ") ?? "N/A";
      const idLabel = body.validId?.replace(/-/g, " ") ?? "N/A";
      const needsCardVerification = ["credit card", "debit card"].includes(paymentLabel);

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Mills Brands Click & Collect</h1>
            <p style="margin: 4px 0 0; opacity: 0.85;">New Pickup Order Submitted</p>
          </div>

          <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151; width: 40%;">Order Number(s)</td>
                <td style="padding: 12px 8px; color: #111827;">${body.orderNumber ?? "N/A"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Full Name</td>
                <td style="padding: 12px 8px; color: #111827;">${body.firstName ?? ""} ${body.lastName ?? ""}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Phone Number</td>
                <td style="padding: 12px 8px; color: #111827;">+61 ${body.phone ?? "N/A"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Valid ID</td>
                <td style="padding: 12px 8px; color: #111827; text-transform: capitalize;">${idLabel}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Payment Method</td>
                <td style="padding: 12px 8px; color: #111827; text-transform: capitalize;">${paymentLabel}</td>
              </tr>
              ${needsCardVerification ? `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Card Last 4 Digits</td>
                <td style="padding: 12px 8px; color: #111827;">**** **** **** ${body.creditCard ?? "N/A"}</td>
              </tr>` : ""}
              <tr>
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Car Park Bay</td>
                <td style="padding: 12px 8px; color: #111827;">${body.carParkBay ?? "N/A"}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fefce8; border: 1px solid #fde047; padding: 16px 24px;">
            <p style="margin: 0; color: #854d0e; font-size: 14px;">
              <strong>Note:</strong> ${needsCardVerification
                ? "Payment and valid ID verification required — ensure details match the name on the order."
                : "Please verify the customer's valid ID before releasing the order."}
            </p>
          </div>

          <div style="background: #e5e7eb; padding: 16px 24px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              Submitted at: ${submittedAt} &nbsp;|&nbsp; Mills Brands Click & Collect Kiosk
            </p>
          </div>
        </div>
      `;
    };

    // ─── RETURN EMAIL ─────────────────────────────────────────────────────────
    const returnHtml = () => {
      const rmaList = body.rmaID
        ?.split(",")
        .map((r: string) => r.trim())
        .filter(Boolean) ?? [];
      const multipleRmas = rmaList.length > 1;
      const hasPaperwork = body.hasRmaPaperwork === true || body.hasRmaPaperwork === "true";

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Mills Brands Click & Collect</h1>
            <p style="margin: 4px 0 0; opacity: 0.85;">New Return Order Submitted</p>
          </div>

          <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151; width: 40%;">
                  RMA ID${multipleRmas ? "s" : ""}
                </td>
                <td style="padding: 12px 8px; color: #111827;">
                  ${multipleRmas
                    ? `<ul style="margin: 0; padding-left: 16px;">
                        ${rmaList.map((r: string) => `<li>${r}</li>`).join("")}
                      </ul>`
                    : rmaList[0] ?? "N/A"
                  }
                </td>
              </tr>
              ${multipleRmas ? `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Total Returns</td>
                <td style="padding: 12px 8px; color: #111827;">${rmaList.length} items</td>
              </tr>` : ""}
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Full Name</td>
                <td style="padding: 12px 8px; color: #111827;">${body.firstName ?? ""} ${body.lastName ?? ""}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Phone Number</td>
                <td style="padding: 12px 8px; color: #111827;">+61 ${body.phone ?? "N/A"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">RMA Paperwork</td>
                <td style="padding: 12px 8px; color: ${hasPaperwork ? "#16a34a" : "#dc2626"}; font-weight: bold;">
                  ${hasPaperwork ? "Paperwork Provided" : "No Paperwork"}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Car Park Bay</td>
                <td style="padding: 12px 8px; color: #111827;">${body.carParkBay ?? "N/A"}</td>
              </tr>
            </table>
          </div>

          ${!hasPaperwork ? `
          <div style="background: #fefce8; border: 1px solid #fde047; padding: 16px 24px;">
            <p style="margin: 0; color: #854d0e; font-size: 14px;">
              <strong>Action Required:</strong> Customer has no RMA paperwork. Please call the customer to the window once paperwork is ready.
            </p>
          </div>` : ""}

          <div style="background: #e5e7eb; padding: 16px 24px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              Submitted at: ${submittedAt} &nbsp;|&nbsp; Mills Brands Click & Collect Kiosk
            </p>
          </div>
        </div>
      `;
    };

    // ─── PRODUCT ENQUIRY EMAIL ────────────────────────────────────────────────
    const productEnquiryHtml = () => {
      const categoryLabel = (body.enquiryCategory ?? "N/A")
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Mills Brands Click & Collect</h1>
            <p style="margin: 4px 0 0; opacity: 0.85;">New Product Enquiry Submitted</p>
          </div>

          <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151; width: 40%;">Enquiry Category</td>
                <td style="padding: 12px 8px; color: #111827;">${categoryLabel}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Full Name</td>
                <td style="padding: 12px 8px; color: #111827;">${body.firstName ?? ""} ${body.lastName ?? ""}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Phone Number</td>
                <td style="padding: 12px 8px; color: #111827;">+61 ${body.phone ?? "N/A"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Car Park Bay</td>
                <td style="padding: 12px 8px; color: #111827;">${body.carParkBay ?? "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 8px; font-weight: bold; color: #374151;">Notes</td>
                <td style="padding: 12px 8px; color: #111827;">${body.notes || "—"}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fefce8; border: 1px solid #fde047; padding: 16px 24px;">
            <p style="margin: 0; color: #854d0e; font-size: 14px;">
              <strong>Action Required:</strong> Please call the customer within the next 5 minutes to assist with their enquiry using the number provided.
          </div>

          <div style="background: #e5e7eb; padding: 16px 24px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              Submitted at: ${submittedAt} &nbsp;|&nbsp; Mills Brands Click & Collect Kiosk
            </p>
          </div>
        </div>
      `;
    };

    // ─── Determine subject & html ─────────────────────────────────────────────
    let subject: string;
    let html: string;

    if (isProductEnquiry) {
      const categoryLabel = (body.enquiryCategory ?? "Enquiry")
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      subject = `Kiosk Product Enquiry - ${categoryLabel} `;
      html = productEnquiryHtml();
    } else if (isReturn) {
      subject = `Kiosk Return Order - ${body.rmaID ?? "New Submission"}`;
      html = returnHtml();
    } else {
      subject = `Kiosk Pickup Order - ${body.orderNumber ?? "New Submission"}`;
      html = pickupHtml();
    }

    await transporter.sendMail({
      from: `"Mills Brands Kiosk" <${process.env.MAIL_USER}>`,
      to: process.env.FRESHDESK_EMAIL,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



// import { NextRequest, NextResponse } from "next/server";
// import nodemailer from "nodemailer";

// // ─────────────────────────────────────────────
// // CLICKSEND SMS HELPER
// // ONLY USED FOR PRODUCT ENQUIRIES
// // ─────────────────────────────────────────────
// async function sendSMS({
//   phone,
//   firstName,
// }: {
//   phone: string;
//   firstName: string;
// }) {
//   if (
//     !process.env.CLICKSEND_USERNAME ||
//     !process.env.CLICKSEND_API_KEY
//   ) {
//     console.error("Missing ClickSend credentials");
//     return;
//   }

//   // Normalize AU phone number
//   let formattedPhone = phone.replace(/\s+/g, "");

//   if (formattedPhone.startsWith("0")) {
//     formattedPhone = "+61" + formattedPhone.substring(1);
//   }

//   const message = `Hi ${firstName}, we've received your product enquiry. Our team will contact you shortly.`;

//   const response = await fetch(
//     "https://rest.clicksend.com/v3/sms/send",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization:
//           "Basic " +
//           Buffer.from(
//             `${process.env.CLICKSEND_USERNAME}:${process.env.CLICKSEND_API_KEY}`
//           ).toString("base64"),
//       },
//       body: JSON.stringify({
//         messages: [
//           {
//             source: "nextjs",
//             from: "MillsBrands",
//             body: message,
//             to: formattedPhone,
//           },
//         ],
//       }),
//     }
//   );

//   const data = await response.json();

//   console.log("ClickSend SMS response:", data);
// }

// export async function POST(req: NextRequest) {
//   try {
//     if (
//       !process.env.MAIL_USER ||
//       !process.env.MAIL_PASSWORD ||
//       !process.env.FRESHDESK_EMAIL
//     ) {
//       console.error("Missing email env vars:", {
//         MAIL_USER: !!process.env.MAIL_USER,
//         MAIL_PASSWORD: !!process.env.MAIL_PASSWORD,
//         FRESHDESK_EMAIL: !!process.env.FRESHDESK_EMAIL,
//       });

//       return NextResponse.json(
//         {
//           success: false,
//           error: "Email service not configured",
//         },
//         { status: 500 }
//       );
//     }

//     const body = await req.json();

//     const isReturn = body.formType === "return";
//     const isProductEnquiry =
//       body.formType === "product-enquiry";

//     const transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 587,
//       secure: false,
//       auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASSWORD,
//       },
//     });

//     const submittedAt = new Date().toLocaleString(
//       "en-AU",
//       {
//         timeZone: "Australia/Sydney",
//       }
//     );

//     // ─────────────────────────────────────────
//     // PICKUP EMAIL
//     // ─────────────────────────────────────────
//     const pickupHtml = () => {
//       const paymentLabel =
//         body.paymentMethod?.replace(/-/g, " ") ?? "N/A";

//       const idLabel =
//         body.validId?.replace(/-/g, " ") ?? "N/A";

//       const needsCardVerification = [
//         "credit card",
//         "debit card",
//       ].includes(paymentLabel);

//       return `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <div style="background: #2563eb; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
//             <h1 style="margin: 0; font-size: 24px;">Mills Brands Click & Collect</h1>
//             <p style="margin: 4px 0 0; opacity: 0.85;">New Pickup Order Submitted</p>
//           </div>

//           <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
//             <table style="width: 100%; border-collapse: collapse;">
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151; width: 40%;">
//                   Order Number(s)
//                 </td>
//                 <td style="padding: 12px 8px; color: #111827;">
//                   ${body.orderNumber ?? "N/A"}
//                 </td>
//               </tr>

//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">
//                   Full Name
//                 </td>
//                 <td style="padding: 12px 8px; color: #111827;">
//                   ${body.firstName ?? ""} ${body.lastName ?? ""}
//                 </td>
//               </tr>

//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">
//                   Phone Number
//                 </td>
//                 <td style="padding: 12px 8px; color: #111827;">
//                   +61 ${body.phone ?? "N/A"}
//                 </td>
//               </tr>

//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">
//                   Valid ID
//                 </td>
//                 <td style="padding: 12px 8px; color: #111827; text-transform: capitalize;">
//                   ${idLabel}
//                 </td>
//               </tr>

//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">
//                   Payment Method
//                 </td>
//                 <td style="padding: 12px 8px; color: #111827; text-transform: capitalize;">
//                   ${paymentLabel}
//                 </td>
//               </tr>

//               ${
//                 needsCardVerification
//                   ? `
//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">
//                   Card Last 4 Digits
//                 </td>
//                 <td style="padding: 12px 8px; color: #111827;">
//                   **** **** **** ${body.creditCard ?? "N/A"}
//                 </td>
//               </tr>
//               `
//                   : ""
//               }

//               <tr>
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">
//                   Car Park Bay
//                 </td>
//                 <td style="padding: 12px 8px; color: #111827;">
//                   ${body.carParkBay ?? "N/A"}
//                 </td>
//               </tr>
//             </table>
//           </div>

//           <div style="background: #fefce8; border: 1px solid #fde047; padding: 16px 24px;">
//             <p style="margin: 0; color: #854d0e; font-size: 14px;">
//               <strong>Note:</strong>
//               ${
//                 needsCardVerification
//                   ? "Payment and valid ID verification required."
//                   : "Please verify the customer's valid ID before releasing the order."
//               }
//             </p>
//           </div>

//           <div style="background: #e5e7eb; padding: 16px 24px; border-radius: 0 0 8px 8px; text-align: center;">
//             <p style="margin: 0; color: #6b7280; font-size: 12px;">
//               Submitted at: ${submittedAt}
//             </p>
//           </div>
//         </div>
//       `;
//     };

//     // ─────────────────────────────────────────
//     // RETURN EMAIL
//     // ─────────────────────────────────────────
//     const returnHtml = () => {
//       return `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <div style="background: #2563eb; color: white; padding: 24px;">
//             <h1>Return Request</h1>
//           </div>

//           <div style="padding: 24px;">
//             <p><strong>RMA:</strong> ${body.rmaID ?? "N/A"}</p>
//             <p><strong>Name:</strong> ${body.firstName ?? ""} ${body.lastName ?? ""}</p>
//             <p><strong>Phone:</strong> +61 ${body.phone ?? "N/A"}</p>
//             <p><strong>Car Park Bay:</strong> ${body.carParkBay ?? "N/A"}</p>
//           </div>
//         </div>
//       `;
//     };

//     // ─────────────────────────────────────────
//     // PRODUCT ENQUIRY EMAIL
//     // ─────────────────────────────────────────
//     const productEnquiryHtml = () => {
//       const categoryLabel = (
//         body.enquiryCategory ?? "N/A"
//       )
//         .split("-")
//         .map(
//           (w: string) =>
//             w.charAt(0).toUpperCase() + w.slice(1)
//         )
//         .join(" ");

//       return `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <div style="background: #2563eb; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
//             <h1 style="margin: 0; font-size: 24px;">Mills Brands Click & Collect</h1>
//             <p style="margin: 4px 0 0; opacity: 0.85;">New Product Enquiry Submitted</p>
//           </div>

//           <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
//             <table style="width: 100%; border-collapse: collapse;">

//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151; width: 40%;">
//                   Enquiry Category
//                 </td>

//                 <td style="padding: 12px 8px; color: #111827;">
//                   ${categoryLabel}
//                 </td>
//               </tr>

//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">
//                   Full Name
//                 </td>

//                 <td style="padding: 12px 8px; color: #111827;">
//                   ${body.firstName ?? ""} ${body.lastName ?? ""}
//                 </td>
//               </tr>

//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">
//                   Phone Number
//                 </td>

//                 <td style="padding: 12px 8px; color: #111827;">
//                   +61 ${body.phone ?? "N/A"}
//                 </td>
//               </tr>

//               <tr style="border-bottom: 1px solid #e5e7eb;">
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">
//                   Car Park Bay
//                 </td>

//                 <td style="padding: 12px 8px; color: #111827;">
//                   ${body.carParkBay ?? "N/A"}
//                 </td>
//               </tr>

//               <tr>
//                 <td style="padding: 12px 8px; font-weight: bold; color: #374151;">
//                   Notes
//                 </td>

//                 <td style="padding: 12px 8px; color: #111827;">
//                   ${body.notes || "—"}
//                 </td>
//               </tr>
//             </table>
//           </div>

//           <div style="background: #fefce8; border: 1px solid #fde047; padding: 16px 24px;">
//             <p style="margin: 0; color: #854d0e; font-size: 14px;">
//               <strong>Action Required:</strong>
//               Please call the customer within the next 5 minutes.
//             </p>
//           </div>

//           <div style="background: #e5e7eb; padding: 16px 24px; border-radius: 0 0 8px 8px; text-align: center;">
//             <p style="margin: 0; color: #6b7280; font-size: 12px;">
//               Submitted at: ${submittedAt}
//             </p>
//           </div>
//         </div>
//       `;
//     };

//     // ─────────────────────────────────────────
//     // SUBJECT + HTML
//     // ─────────────────────────────────────────
//     let subject: string;
//     let html: string;

//     if (isProductEnquiry) {
//       const categoryLabel = (
//         body.enquiryCategory ?? "Enquiry"
//       )
//         .split("-")
//         .map(
//           (w: string) =>
//             w.charAt(0).toUpperCase() + w.slice(1)
//         )
//         .join(" ");

//       subject = `Kiosk Product Enquiry - ${categoryLabel}`;
//       html = productEnquiryHtml();
//     } else if (isReturn) {
//       subject = `Kiosk Return Order - ${
//         body.rmaID ?? "New Submission"
//       }`;

//       html = returnHtml();
//     } else {
//       subject = `Kiosk Pickup Order - ${
//         body.orderNumber ?? "New Submission"
//       }`;

//       html = pickupHtml();
//     }

//     // ─────────────────────────────────────────
//     // SEND EMAIL
//     // ─────────────────────────────────────────
//     await transporter.sendMail({
//       from: `"Mills Brands Kiosk" <${process.env.MAIL_USER}>`,
//       to: process.env.FRESHDESK_EMAIL,
//       subject,
//       html,
//     });

//     // ─────────────────────────────────────────
//     // SEND SMS ONLY FOR PRODUCT ENQUIRY
//     // ─────────────────────────────────────────
//     try {
//       if (isProductEnquiry) {
//         await sendSMS({
//           phone: body.phone,
//           firstName: body.firstName,
//         });
//       }
//     } catch (smsError) {
//       console.error("SMS send failed:", smsError);
//     }

//     return NextResponse.json({
//       success: true,
//     });
//   } catch (error: any) {
//     console.error("Request error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }