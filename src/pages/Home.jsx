
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import DonorGrid from "../components/DonorGrid";
import { Loading, ErrorState } from "../components/Feedback";
import { getHero, getContent } from "../services/heroService";
import { listDonors } from "../services/donorService";
import { useAsync } from "../lib/useAsync";
import { BLOOD_GROUPS } from "../lib/constants";
import { listMissingPublic } from "../services/adminService";
import { StatusBadge } from "./MissingChildren";
import { toBn } from "../lib/bn";
import Seo from "../components/Seo";

function extractItems(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.donors)) return response.donors;
  if (Array.isArray(response?.cases)) return response.cases;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.donors)) return response.data.donors;
  if (Array.isArray(response?.data?.cases)) return response.data.cases;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

const focus = [
  [
    "নারী ও শিশু সুরক্ষা",
    "নারী ও শিশুর নিরাপত্তা ও সুরক্ষা বিষয়ে সহায়তা ও সচেতনতা।",
  ],
  [
    "মানবিক সহায়তা",
    "সংকটে থাকা মানুষের পাশে দাঁড়ানো।",
  ],
  [
    "রক্তদাতা নেটওয়ার্ক",
    "জরুরি প্রয়োজনে রক্তদাতা খুঁজে পাওয়ার সহজ উপায়।",
  ],
  [
    "কমিউনিটি সাপোর্ট",
    "স্থানীয় মানুষের পারস্পরিক সহযোগিতা।",
  ],
  [
    "জরুরি সহায়তা",
    "বিপদের সময় দ্রুত যোগাযোগের সুযোগ।",
  ],
];

export default function Home() {
  const hero = useAsync(getHero, []);
  const about = useAsync(() => getContent("about"), []);

  // সব রক্তদাতা আনবে; শুধু available ফিল্টার করা হবে না।
  const donors = useAsync(
    () => listDonors({ limit: 10 }),
    []
  );

  // Backend শুধু published রিপোর্ট ফেরত দেবে।
  const missing = useAsync(listMissingPublic, []);

  const donorItems = extractItems(donors.data);
  const missingItems = extractItems(missing.data);

  return (
    <>
      <Seo
        description="নারী ও শিশু সুরক্ষা, মানবিক সহায়তা, জরুরি সহায়তা ও রক্তদাতা নেটওয়ার্ক — Shelter of Hope। রক্তদাতা খুঁজুন অথবা নিজে রক্তদাতা হোন।"
      />

      {hero.loading ? (
        <Loading />
      ) : hero.data ? (
        <Hero hero={hero.data} />
      ) : null}

      {/* About section */}
      <section className="section">
        <div className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">আমাদের পরিচয়</p>
            <h2 className="text-3xl">Shelter of Hope সম্পর্কে</h2>
            <p className="mt-4 text-muted">
              {about.data?.intro}
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {focus.map(([title, description]) => (
              <div key={title} className="card p-5">
                <div
                  className="mb-3 h-1 w-10 rounded bg-gradient-to-r from-brand-500 to-brand-700"
                  aria-hidden="true"
                />
                <h3 className="text-base">{title}</h3>
                <p className="mt-2 text-sm text-muted">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blood donor section */}
      <section className="section bg-slate-50">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">রক্তদাতা নেটওয়ার্ক</p>
              <h2 className="text-3xl">রক্তদাতা খুঁজুন</h2>
            </div>

            <Link to="/donors" className="btn-outline">
              সব রক্তদাতা দেখুন
            </Link>
          </div>

          <div
            className="mt-5 flex flex-wrap gap-2"
            aria-label="রক্তের গ্রুপ অনুযায়ী খুঁজুন"
          >
            {BLOOD_GROUPS.map((group) => (
              <Link
                key={group}
                to={`/donors?bloodGroup=${encodeURIComponent(group)}`}
                className="rounded-lg border border-line bg-white px-4 py-1.5 text-sm font-bold text-brand-700 hover:border-brand-500"
              >
                {group}
              </Link>
            ))}
          </div>

          <div className="mt-8">
            {donors.loading ? (
              <Loading />
            ) : donors.error ? (
              <ErrorState
                message={donors.error}
                onRetry={donors.reload}
              />
            ) : donorItems.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="font-semibold text-slate-700">
                  বর্তমানে কোনো রক্তদাতার তথ্য পাওয়া যায়নি।
                </p>
                <p className="mt-2 text-sm text-muted">
                  পরে আবার চেষ্টা করুন অথবা সব রক্তদাতার তালিকা দেখুন।
                </p>
                <Link
                  to="/donors"
                  className="btn-outline mt-4 inline-flex"
                >
                  সব রক্তদাতা দেখুন
                </Link>
              </div>
            ) : (
              <div
                className="moving-track"
                aria-label="রক্তদাতাদের চলমান তালিকা"
              >
                <div className="moving-track-inner">
                  {[...donorItems, ...donorItems].map((donor, index) => (
                    <div
                      className="moving-card"
                      key={`${donor.donorId || donor._id || donor.id || donor.phone || donor.name}-${index}`}
                    >
                      <DonorGrid donors={[donor]} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Missing persons section */}
      <section className="section">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">মানবিক উদ্যোগ</p>
              <h2 className="text-3xl">
                নিখোঁজ ব্যক্তিদের খুঁজে পেতে সহায়তা করুন
              </h2>
              <p className="mt-2 text-muted">
                প্রকাশিত তথ্য দেখুন এবং প্রয়োজনীয় তথ্য শেয়ার করুন।
              </p>
            </div>

            <Link to="/missing" className="btn-outline">
              সব রিপোর্ট দেখুন
            </Link>
          </div>

          <div className="mt-8" aria-live="polite">
            {missing.loading ? (
              <Loading />
            ) : missing.error ? (
              <ErrorState
                message={missing.error}
                onRetry={missing.reload}
              />
            ) : missingItems.length === 0 ? (
              <div className="rounded-xl border border-line bg-slate-50 p-6 text-center">
                <p className="text-muted">
                  বর্তমানে প্রকাশিত কোনো রিপোর্ট নেই।
                </p>
                <Link
                  to="/missing"
                  className="btn-outline mt-4 inline-flex"
                >
                  সব রিপোর্ট দেখুন
                </Link>
              </div>
            ) : (
              <div className="moving-track">
                <div className="moving-track-inner moving-track-reverse">
                  {[...missingItems, ...missingItems].map((person, index) => {
                    const id = person._id || person.id || person.caseId;

                    return (
                      <article
                        className="missing-moving-card card overflow-hidden"
                        key={`${id || person.name || "missing-person"}-${index}`}
                      >
                        {person.image ? (
                          <img
                            src={person.image}
                            alt={person.name || "নিখোঁজ ব্যক্তি"}
                            className="h-48 w-full bg-slate-100 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-sm text-muted">
                            ছবি নেই
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3>
                              {person.name || "নাম উল্লেখ নেই"}
                            </h3>
                            <StatusBadge s={person.status} />
                          </div>

                          <p className="mt-1 text-sm text-muted">
                            {person.age != null
                              ? `বয়স ${toBn(person.age)} বছর · `
                              : ""}
                            {person.missingPlace || "স্থান উল্লেখ নেই"}
                          </p>

                          {id ? (
                            <Link
                              to={`/missing/${id}`}
                              className="btn-outline btn-sm mt-3"
                            >
                              বিস্তারিত দেখুন
                            </Link>
                          ) : (
                            <Link
                              to="/missing"
                              className="btn-outline btn-sm mt-3"
                            >
                              সব রিপোর্ট দেখুন
                            </Link>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="section">
        <div className="container-x">
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-12 text-center text-white sm:px-12">
            <h2 className="text-2xl text-white sm:text-3xl">
              আপনিও হতে পারেন কারও জীবন বাঁচানোর সহযোগী
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              রক্তদাতা হিসেবে নিবন্ধন করুন, যাতে প্রয়োজনের সময় মানুষ আপনার সঙ্গে যোগাযোগ করতে পারে।
            </p>
            <Link
              to="/be-a-donor"
              className="btn mt-6 bg-white text-brand-700 hover:bg-brand-50"
            >
              রক্তদাতা হিসেবে নিবন্ধন করুন
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
