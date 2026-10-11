
import { PageHeader, Loading, ErrorState } from "../components/Feedback";
import { getContent } from "../services/heroService";
import { getPublicTeamMembers } from "../services/teamService";
import { useAsync } from "../lib/useAsync";
import Seo from "../components/Seo";

const sections = [
  ["mission", "আমাদের লক্ষ্য"],
  ["objective", "আমাদের উদ্দেশ্য"],
  ["womenChildren", "নারী ও শিশু সুরক্ষা"],
  ["bloodNetwork", "রক্তদাতা নেটওয়ার্ক"],
  ["community", "কমিউনিটি সাপোর্ট"],
  ["humanitarian", "মানবিক সহায়তা"],
];

function TeamSection() {
  const {
    data,
    loading,
    error,
    reload,
  } = useAsync(() => getPublicTeamMembers(), []);

  const members = data?.items || [];

  return (
    <section className="container-x section">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          আমাদের মানুষ
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight">
          আমাদের টিম
        </h2>

        <p className="mt-3 leading-7 text-muted">
          মানবিক সহায়তা, নারী ও শিশু সুরক্ষা এবং নিরাপদ সমাজ গঠনে
          কাজ করছেন আমাদের টিমের সদস্যরা।
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={reload}
        />
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-line p-8 text-center">
          <h3 className="text-lg font-semibold">
            আমাদের টিম
          </h3>
          <p className="mt-2 text-muted">
            টিম সদস্যদের পরিচিতি শিগগিরই প্রকাশ করা হবে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <article
              key={member._id}
              className="group overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    ছবি যোগ করা হয়নি
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-xl font-semibold text-slate-900">
                  {member.name}
                </h3>

                <p className="mt-1 font-medium text-brand-600">
                  {member.designation}
                </p>

                {member.bio && (
                  <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-muted">
                    {member.bio}
                  </p>
                )}

                {(member.email || member.phone) && (
                  <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
                    {member.email && (
                      <div className="flex items-start gap-2">
                        <span
                          className="shrink-0 font-medium text-slate-700"
                        >
                          ইমেইল:
                        </span>

                        <a
                          href={`mailto:${member.email}`}
                          className="break-all text-brand-600 hover:underline"
                        >
                          {member.email}
                        </a>
                      </div>
                    )}

                    {member.phone && (
                      <div className="flex items-start gap-2">
                        <span
                          className="shrink-0 font-medium text-slate-700"
                        >
                          ফোন:
                        </span>

                        <a
                          href={`tel:${member.phone}`}
                          className="break-words text-brand-600 hover:underline"
                        >
                          {member.phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function About() {
  const {
    data,
    loading,
    error,
    reload,
  } = useAsync(() => getContent("about"), []);

  return (
    <>
      <Seo
        title="আমাদের সম্পর্কে"
        description="Shelter of Hope-এর লক্ষ্য, উদ্দেশ্য, টিম এবং কার্যক্রম সম্পর্কে জানুন।"
      />

      <PageHeader
        eyebrow="পরিচিতি"
        title="আমাদের সম্পর্কে"
      >
        {data?.intro}
      </PageHeader>

      {/* দ্বিতীয় সেকশন: টিম সদস্যদের পরিচিতি */}
      <TeamSection />

      {/* আগের পরিচিতিমূলক সেকশনগুলো */}
      <div className="container-x section">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={reload}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map(([key, title]) => (
              <section
                key={key}
                className="card p-6"
              >
                <h2 className="text-xl">
                  {title}
                </h2>

                <p className="mt-3 whitespace-pre-line text-muted">
                  {data?.[key]}
                </p>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
