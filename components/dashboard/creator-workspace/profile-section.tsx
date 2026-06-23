import { CreatorPortfolioGallery } from "@/components/dashboard/creator-portfolio-gallery";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { MotionScale } from "@/components/shared/motion";
import { formatCompactNumber, formatCurrency, formatFileSize, formatPercent, getInitials } from "@/lib/utils";
import { CameraIcon } from "./icons";
import { parseListInput, parsePositiveMetric } from "./helpers";
import { SectionPanel } from "./section-panel";
import type { CreatorWorkspaceSectionContext } from "./types";

export function CreatorWorkspaceProfileSection({ ctx }: { ctx: CreatorWorkspaceSectionContext }) {
  const {
    profile,
    data,
    displayName,
    profileForm,
    isSubmittingProfile,
    isSavingProfile,
    handleProfileSave,
    updateProfileForm,
    profileFeedback,
    portfolioFiles,
    setPortfolioFiles,
    portfolioFeedback,
    isUploadingPortfolio,
    handlePortfolioUpload,
    pendingPortfolioRemovalId,
    handlePortfolioRemove,
  } = ctx;
  const profileBusy = isSubmittingProfile || isSavingProfile;
  const combinedAudience =
    parsePositiveMetric(profileForm.instagramFollowers) +
    parsePositiveMetric(profileForm.tiktokFollowers) +
    parsePositiveMetric(profileForm.youtubeSubscribers);
  const featuredBrands = parseListInput(profileForm.featuredBrands);
  const profileHighlights = [
    {
      label: "Combined audience",
      value: combinedAudience > 0 ? formatCompactNumber(combinedAudience) : "Add stats",
    },
    {
      label: "Engagement rate",
      value:
        parsePositiveMetric(profileForm.engagementRate) > 0
          ? formatPercent(parsePositiveMetric(profileForm.engagementRate))
          : "Add %",
    },
    {
      label: "Avg. views",
      value:
        parsePositiveMetric(profileForm.averageViews) > 0
          ? formatCompactNumber(parsePositiveMetric(profileForm.averageViews))
          : "Add views",
    },
    {
      label: "Featured brands",
      value: featuredBrands.length ? String(featuredBrands.length) : "Add proof",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionPanel>
        <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
          Profile Information
        </h2>
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 text-3xl font-semibold text-white">
              {getInitials(displayName)}
            </span>
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-white shadow-[0_12px_24px_rgba(7,107,210,0.25)]">
              <CameraIcon className="h-5 w-5" />
            </span>
          </div>
          <div>
            <p className="text-[1rem] font-semibold text-slate-950">Profile Photo</p>
            <p className="mt-2 text-sm text-slate-500">
              Build the profile brands will actually search and filter against.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {profileHighlights.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-[1rem] capitalize text-slate-400">
                {item.label}
              </p>
              <p className="mt-3 text-base font-semibold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleProfileSave}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="creator-first-name"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="creator-first-name"
                required
                value={profileForm.firstName}
                onChange={(event) =>
                  updateProfileForm("firstName", event.target.value)
                }
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
            <div>
              <label
                htmlFor="creator-last-name"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="creator-last-name"
                required
                value={profileForm.lastName}
                onChange={(event) =>
                  updateProfileForm("lastName", event.target.value)
                }
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="creator-email"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Email
            </label>
            <input
              id="creator-email"
              disabled
              value={profile.email}
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 outline-none"
            />
            <p className="mt-2 text-sm text-slate-400">Email cannot be changed</p>
          </div>

          <div>
            <label
              htmlFor="creator-headline"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Headline
            </label>
            <input
              id="creator-headline"
              value={profileForm.headline}
              onChange={(event) =>
                updateProfileForm("headline", event.target.value)
              }
              placeholder="Beauty and lifestyle UGC creator"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="creator-location"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Location
              </label>
              <input
                id="creator-location"
                value={profileForm.location}
                onChange={(event) =>
                  updateProfileForm("location", event.target.value)
                }
                placeholder="New York, USA"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
            <div>
              <label
                htmlFor="creator-base-rate"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Base Rate
              </label>
              <input
                id="creator-base-rate"
                type="number"
                min="0"
                step="0.01"
                value={profileForm.baseRate}
                onChange={(event) =>
                  updateProfileForm("baseRate", event.target.value)
                }
                placeholder="750"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label
                htmlFor="creator-engagement-rate"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Engagement Rate (%)
              </label>
              <input
                id="creator-engagement-rate"
                type="number"
                min="0"
                step="0.01"
                value={profileForm.engagementRate}
                onChange={(event) =>
                  updateProfileForm("engagementRate", event.target.value)
                }
                placeholder="4.6"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
            <div>
              <label
                htmlFor="creator-average-views"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Average Views
              </label>
              <input
                id="creator-average-views"
                type="number"
                min="0"
                step="1"
                value={profileForm.averageViews}
                onChange={(event) =>
                  updateProfileForm("averageViews", event.target.value)
                }
                placeholder="18500"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
            <div className="xl:col-span-2">
              <label
                htmlFor="creator-featured-brands"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Featured Brands
              </label>
              <input
                id="creator-featured-brands"
                value={profileForm.featuredBrands}
                onChange={(event) =>
                  updateProfileForm("featuredBrands", event.target.value)
                }
                placeholder="Rhode, Nike, Notion"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <p className="mt-2 text-sm text-slate-400">
                Add brand names you have worked with, separated by commas.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="creator-bio"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Short Bio
            </label>
            <textarea
              id="creator-bio"
              rows={4}
              value={profileForm.bio}
              onChange={(event) => updateProfileForm("bio", event.target.value)}
              placeholder="Tell brands how you create, what kind of products you perform best with, and what makes your content convert."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="creator-niches"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Niches
              </label>
              <input
                id="creator-niches"
                value={profileForm.niches}
                onChange={(event) =>
                  updateProfileForm("niches", event.target.value)
                }
                placeholder="Beauty, Skincare, Lifestyle"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <p className="mt-2 text-sm text-slate-400">
                Separate each niche with a comma.
              </p>
            </div>
            <div>
              <label
                htmlFor="creator-platform-specialties"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Platform Specialties
              </label>
              <input
                id="creator-platform-specialties"
                value={profileForm.platformSpecialties}
                onChange={(event) =>
                  updateProfileForm("platformSpecialties", event.target.value)
                }
                placeholder="TikTok, Instagram Reels, YouTube Shorts"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <p className="mt-2 text-sm text-slate-400">
                These power brand-side discovery filters.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="creator-audience-summary"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Audience Summary
              </label>
              <textarea
                id="creator-audience-summary"
                rows={4}
                value={profileForm.audienceSummary}
                onChange={(event) =>
                  updateProfileForm("audienceSummary", event.target.value)
                }
                placeholder="Share audience demographics, conversion strengths, or why your content performs."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
            <div>
              <label
                htmlFor="creator-past-work"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Past Work
              </label>
              <textarea
                id="creator-past-work"
                rows={4}
                value={profileForm.pastWork}
                onChange={(event) =>
                  updateProfileForm("pastWork", event.target.value)
                }
                placeholder="Mention notable brand work, vertical expertise, or results you can reference."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="creator-featured-result"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Featured Result
            </label>
            <textarea
              id="creator-featured-result"
              rows={3}
              value={profileForm.featuredResult}
              onChange={(event) =>
                updateProfileForm("featuredResult", event.target.value)
              }
              placeholder="Example: Drove a 3.8x ROAS for a skincare launch with three creator-style product demos."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600">Portfolio and Social Links</p>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <input
                type="url"
                value={profileForm.portfolioUrl}
                onChange={(event) =>
                  updateProfileForm("portfolioUrl", event.target.value)
                }
                placeholder="Portfolio URL"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <input
                type="url"
                value={profileForm.websiteUrl}
                onChange={(event) =>
                  updateProfileForm("websiteUrl", event.target.value)
                }
                placeholder="Website URL"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <input
                value={profileForm.instagramHandle}
                onChange={(event) =>
                  updateProfileForm("instagramHandle", event.target.value)
                }
                placeholder="Instagram handle"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <input
                type="number"
                min="0"
                step="1"
                value={profileForm.instagramFollowers}
                onChange={(event) =>
                  updateProfileForm("instagramFollowers", event.target.value)
                }
                placeholder="Instagram followers"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <input
                type="url"
                value={profileForm.instagramUrl}
                onChange={(event) =>
                  updateProfileForm("instagramUrl", event.target.value)
                }
                placeholder="Instagram profile URL"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <input
                type="url"
                value={profileForm.tiktokUrl}
                onChange={(event) =>
                  updateProfileForm("tiktokUrl", event.target.value)
                }
                placeholder="TikTok profile URL"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <input
                value={profileForm.tiktokHandle}
                onChange={(event) =>
                  updateProfileForm("tiktokHandle", event.target.value)
                }
                placeholder="TikTok handle"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <input
                type="number"
                min="0"
                step="1"
                value={profileForm.tiktokFollowers}
                onChange={(event) =>
                  updateProfileForm("tiktokFollowers", event.target.value)
                }
                placeholder="TikTok followers"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <input
                type="url"
                value={profileForm.youtubeUrl}
                onChange={(event) =>
                  updateProfileForm("youtubeUrl", event.target.value)
                }
                placeholder="YouTube channel URL"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <input
                value={profileForm.youtubeHandle}
                onChange={(event) =>
                  updateProfileForm("youtubeHandle", event.target.value)
                }
                placeholder="YouTube handle"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <input
                type="number"
                min="0"
                step="1"
                value={profileForm.youtubeSubscribers}
                onChange={(event) =>
                  updateProfileForm("youtubeSubscribers", event.target.value)
                }
                placeholder="YouTube subscribers"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <MotionScale
              type="submit"
              disabled={profileBusy}
              className="inline-flex h-10 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-8 text-base font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profileBusy ? "Saving..." : "Save Changes"}
            </MotionScale>
            {profileFeedback ? (
              <p className="text-sm text-slate-500">{profileFeedback}</p>
            ) : null}
          </div>
        </form>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">
                Portfolio Samples
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Upload the creator content brands should see first in discovery.
                These samples appear directly in the brand directory.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
              {data.profile_assets.length} / 12 samples
            </span>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1">
                <label
                  htmlFor="creator-portfolio-files"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Add image or video samples
                </label>
                <input
                  id="creator-portfolio-files"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(event) =>
                    setPortfolioFiles(
                      Array.from(event.target.files ?? []).filter(
                        (file) => file.size > 0,
                      ),
                    )
                  }
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-3 file:text-sm file:font-semibold file:text-slate-700"
                />
                <p className="mt-2 text-sm text-slate-400">
                  Up to 12 total samples. Max 25 MB each.
                </p>
              </div>
              <MotionScale
                type="button"
                onClick={() => void handlePortfolioUpload()}
                disabled={
                  isUploadingPortfolio ||
                  !portfolioFiles.length ||
                  data.profile_assets.length >= 12
                }
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-6 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploadingPortfolio ? "Uploading..." : "Upload samples"}
              </MotionScale>
            </div>

            {portfolioFiles.length ? (
              <div className="mt-5 grid gap-2 md:grid-cols-2">
                {portfolioFiles.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-600"
                  >
                    <span className="truncate pr-3 font-medium text-slate-900">
                      {file.name}
                    </span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {portfolioFeedback ? (
              <p className="mt-4 text-sm text-slate-500">{portfolioFeedback}</p>
            ) : null}
          </div>

          <div className="mt-6">
            <CreatorPortfolioGallery
              assets={data.profile_assets}
              emptyLabel="No samples uploaded yet. Add portfolio content brands can review."
              onRemove={(asset) => void handlePortfolioRemove(asset)}
              removingAssetId={pendingPortfolioRemovalId}
            />
          </div>
        </div>
      </SectionPanel>

      <SectionPanel>
        <h2 className="text-[1.2rem] font-semibold text-slate-950">Account</h2>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-slate-900">Sign out of CIRCL</p>
            <p className="mt-2 text-sm text-slate-500">
              You can sign back in anytime with the same account.
            </p>
          </div>
          <SignOutButton variant="light" />
        </div>
      </SectionPanel>
    </div>
  );
}
