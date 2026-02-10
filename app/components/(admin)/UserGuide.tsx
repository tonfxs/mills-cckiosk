import Link from "next/link";

export type UserGuideStep = {
  title: string;
  description?: string;
  desc?: string;
  href?: string;
  openInNewTab?: boolean;
};

export type UserGuideSection = {
  id: string;
  title: string;
  description?: string;
  desc?: string;
  steps?: UserGuideStep[];
};

type UserGuideProps = {
  title?: string;
  subtitle?: string;
  sections: UserGuideSection[];
};

export function UserGuide({
  title = "User Guide",
  subtitle = "Everything you need to know about the Mills Shopfront Kiosk",
  sections,
}: UserGuideProps) {
  return (
    <div className="w-full px-6 py-6 lg:px-10 lg:py-8">
      <div className="max-w-5xl space-y-10">
        {/* Header */}
        <header className="space-y-2 border-b pb-6">
          <h1 className="text-3xl font-semibold text-gray-900">
            {title}
          </h1>
          <p className="text-gray-600">
            {subtitle}
          </p>
        </header>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-lg border border-slate-200 bg-white px-6 py-6 my-6"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {section.title}
              </h2>

              {section.description && (
                <p className="mt-1 text-gray-600">
                  {section.description}
                </p>
              )}


              {section.steps && (
              <ol className="mt-6 space-y-5">
                {section.steps.map((step, index) => {
                  const content = (
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">
                        {step.title}
                      </p>
                      {step.description && (
                        <p className="text-sm text-gray-600">
                          {step.description}
                        </p>
                      )}

                      {step.desc && (
                        <p className="text-sm text-gray-600">
                          {step.desc}
                        </p>
                      )}
                    </div>
                  );
                
                  const isExternal = step.openInNewTab && step.href;
                
                  return (
                    <li key={index} className="flex items-start gap-4">
                
                      {step.href ? (
                        <Link
                          href={step.href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          className="group rounded-md p-1 -m-1 transition hover:bg-gray-50"
                        >
                          {content}
                    
                          <span className="mt-2 block text-xs font-medium text-blue-600 group-hover:underline">
                            {isExternal ? "Open link" : "Go to page →"}
                          </span>
                        </Link>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ol>
            )}


              
            </section>
          ))}
        </div>

        {/* CTA */}
        <section className="rounded-lg border border-red-300 bg-red-50 px-6 py-6">
          <h3 className="text-lg font-semibold text-red-600">
            For any errors encountered in the dashboard:
          </h3>
          <p className="mt-1 text-red-600">
            Please escalate to ESS/Devs. 
          </p>
        </section>
      </div>
    </div>
  );
}