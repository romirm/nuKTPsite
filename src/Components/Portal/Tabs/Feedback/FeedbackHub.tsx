import React, { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

type FeedbackTag = "rush" | "pledging" | "website" | "general" | "other";

type FeedbackReply = {
  id: string;
  message: string;
  adminUid: string;
  adminName: string;
  createdAt: number;
};

type FeedbackPost = {
  id: string;
  message: string;
  tag: FeedbackTag;
  anonymous: boolean;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  createdAt: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedByName?: string;
  replies: FeedbackReply[];
};

type FeedbackPostRaw = {
  message?: string;
  tag?: FeedbackTag;
  anonymous?: boolean;
  authorUid?: string;
  authorName?: string;
  authorPhoto?: string;
  createdAt?: number;
  resolved?: boolean;
  resolvedAt?: number;
  resolvedByName?: string;
  replies?: Record<string, FeedbackReplyRaw>;
};

type FeedbackReplyRaw = {
  message?: string;
  adminUid?: string;
  adminName?: string;
  createdAt?: number;
};

interface FeedbackHubProps {
  database: any;
  uid: string;
  currentUserName: string;
  currentUserImage: string;
  isAdmin: boolean;
}

const TAG_OPTIONS: { value: FeedbackTag; label: string }[] = [
  { value: "rush", label: "Rush" },
  { value: "pledging", label: "Pledging" },
  { value: "website", label: "Website" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

const parseReplies = (rawReplies: Record<string, FeedbackReplyRaw> | undefined): FeedbackReply[] => {
  if (!rawReplies || typeof rawReplies !== "object") {
    return [];
  }

  return Object.keys(rawReplies)
    .map((replyId) => {
      const raw = rawReplies[replyId] || {};
      const message = typeof raw.message === "string" ? raw.message.trim() : "";

      return {
        id: replyId,
        message,
        adminUid: typeof raw.adminUid === "string" ? raw.adminUid : "",
        adminName:
          typeof raw.adminName === "string" && raw.adminName.trim().length > 0
            ? raw.adminName.trim()
            : "Admin",
        createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0,
      };
    })
    .filter((reply) => reply.message.length > 0)
    .sort((a, b) => a.createdAt - b.createdAt);
};

const parsePosts = (rawPosts: Record<string, FeedbackPostRaw> | null): FeedbackPost[] => {
  if (!rawPosts || typeof rawPosts !== "object") {
    return [];
  }

  return Object.keys(rawPosts)
    .map((postId) => {
      const raw = rawPosts[postId] || {};
      const message = typeof raw.message === "string" ? raw.message.trim() : "";
      const tag =
        typeof raw.tag === "string" &&
        TAG_OPTIONS.some((option) => option.value === raw.tag)
          ? raw.tag
          : "general";

      const post: FeedbackPost = {
        id: postId,
        message,
        tag,
        anonymous: raw.anonymous === true,
        authorUid: typeof raw.authorUid === "string" ? raw.authorUid : "",
        authorName:
          typeof raw.authorName === "string" && raw.authorName.trim().length > 0
            ? raw.authorName.trim()
            : raw.anonymous
              ? "Anonymous"
              : "Member",
        authorPhoto: typeof raw.authorPhoto === "string" ? raw.authorPhoto : "",
        createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0,
        resolved: raw.resolved === true,
        replies: parseReplies(raw.replies),
      };

      if (typeof raw.resolvedAt === "number") {
        post.resolvedAt = raw.resolvedAt;
      }

      if (typeof raw.resolvedByName === "string" && raw.resolvedByName.trim().length > 0) {
        post.resolvedByName = raw.resolvedByName.trim();
      }

      return post;
    })
    .filter((post) => post.message.length > 0)
    .sort((a, b) => {
      if (a.resolved !== b.resolved) {
        return Number(a.resolved) - Number(b.resolved);
      }
      return b.createdAt - a.createdAt;
    });
};

const formatDateTime = (timestamp: number): string => {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "Unknown time";
  }

  return new Date(timestamp).toLocaleString();
};

const FeedbackHub: React.FC<FeedbackHubProps> = ({
  database,
  uid,
  currentUserName,
  currentUserImage,
  isAdmin,
}) => {
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<FeedbackTag>("general");
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyDraftsByPost, setReplyDraftsByPost] = useState<Record<string, string>>({});
  const [busyPostIds, setBusyPostIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!database) {
      return;
    }

    const feedbackRef = ref(database, "feedback/posts");
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      const parsed = parsePosts(
        snapshot.exists() && typeof snapshot.val() === "object"
          ? (snapshot.val() as Record<string, FeedbackPostRaw>)
          : null
      );
      setPosts(parsed);
    });

    return () => {
      unsubscribe();
    };
  }, [database]);

  const unresolvedCount = useMemo(() => {
    return posts.filter((post) => !post.resolved).length;
  }, [posts]);

  const setPostBusy = (postId: string, isBusy: boolean) => {
    setBusyPostIds((current) => ({
      ...current,
      [postId]: isBusy,
    }));
  };

  const submitFeedback = async () => {
    if (!database || !uid) {
      setStatusMessage("Please sign in before submitting feedback.");
      return;
    }

    const message = messageInput.trim();
    if (message.length < 6) {
      setStatusMessage("Please write at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Submitting feedback...");

    try {
      const postRef = push(ref(database, "feedback/posts"));
      await set(postRef, {
        message,
        tag: selectedTag,
        anonymous: anonymousMode,
        authorUid: uid,
        authorName: anonymousMode ? "Anonymous" : currentUserName || "Member",
        authorPhoto: anonymousMode ? "" : currentUserImage || "",
        createdAt: Date.now(),
        resolved: false,
      });

      setMessageInput("");
      setSelectedTag("general");
      setAnonymousMode(false);
      setStatusMessage("Feedback submitted. Thank you!");
    } catch (error) {
      console.error("Failed to submit feedback", error);
      setStatusMessage("Could not submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleResolved = async (post: FeedbackPost) => {
    if (!database || !isAdmin || !uid) {
      return;
    }

    setPostBusy(post.id, true);
    try {
      const nextResolved = !post.resolved;
      await update(ref(database, `feedback/posts/${post.id}`), {
        resolved: nextResolved,
        resolvedAt: nextResolved ? Date.now() : null,
        resolvedByUid: nextResolved ? uid : null,
        resolvedByName: nextResolved ? currentUserName || "Admin" : null,
      });

      setStatusMessage(nextResolved ? "Marked as resolved." : "Marked as unresolved.");
    } catch (error) {
      console.error("Failed to update resolved state", error);
      setStatusMessage("Could not update resolved state.");
    } finally {
      setPostBusy(post.id, false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!database || !isAdmin) {
      return;
    }

    const approved = window.confirm("Delete this feedback item permanently?");
    if (!approved) {
      return;
    }

    setPostBusy(postId, true);
    try {
      await remove(ref(database, `feedback/posts/${postId}`));
      setStatusMessage("Feedback deleted.");
    } catch (error) {
      console.error("Failed to delete feedback", error);
      setStatusMessage("Could not delete this feedback item.");
    } finally {
      setPostBusy(postId, false);
    }
  };

  const submitReply = async (postId: string) => {
    if (!database || !isAdmin || !uid) {
      return;
    }

    const draft = (replyDraftsByPost[postId] || "").trim();
    if (draft.length === 0) {
      setStatusMessage("Write a reply before submitting.");
      return;
    }

    setPostBusy(postId, true);
    try {
      const replyRef = push(ref(database, `feedback/posts/${postId}/replies`));
      await set(replyRef, {
        message: draft,
        adminUid: uid,
        adminName: currentUserName || "Admin",
        createdAt: Date.now(),
      });

      setReplyDraftsByPost((current) => ({
        ...current,
        [postId]: "",
      }));
      setStatusMessage("Reply posted.");
    } catch (error) {
      console.error("Failed to post reply", error);
      setStatusMessage("Could not post reply.");
    } finally {
      setPostBusy(postId, false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-700">
              <ChatBubbleLeftRightIcon className="h-7 w-7" />
              <h1 className="text-2xl font-bold sm:text-3xl">Feedback</h1>
            </div>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Share questions or suggestions. Admin can reply and resolve items.
            </p>
          </div>

          <div className="rounded-lg border border-blue-100 bg-white px-4 py-2 text-right shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Open Items
            </p>
            <p className="text-xl font-bold text-blue-700">{unresolvedCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Submit Feedback</h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => {
              const selected = selectedTag === tag.value;
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => setSelectedTag(tag.value)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    selected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  <TagIcon className="h-3.5 w-3.5" />
                  {tag.label}
                </button>
              );
            })}
          </div>

          <textarea
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            placeholder="Write your question, issue, or suggestion here..."
            className="mt-4 min-h-[120px] w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
            maxLength={1200}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={anonymousMode}
                onChange={(event) => setAnonymousMode(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Submit anonymously
            </label>

            <button
              type="button"
              onClick={submitFeedback}
              disabled={isSubmitting}
              className={`inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 ${
                isSubmitting ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>

          {statusMessage.length > 0 && (
            <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              {statusMessage}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {posts.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600 shadow-sm">
              No feedback yet. Be the first to submit one.
            </div>
          )}

          {posts.map((post) => {
            const busy = busyPostIds[post.id] === true;

            return (
              <div
                key={post.id}
                className={`rounded-xl border bg-white p-4 shadow-sm ${
                  post.resolved ? "border-emerald-200" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {post.anonymous || !post.authorPhoto ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                        A
                      </div>
                    ) : (
                      <img
                        src={post.authorPhoto}
                        alt={post.authorName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{post.authorName}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(post.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                      {post.tag}
                    </span>
                    {post.resolved ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                        Open
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{post.message}</p>

                {post.resolved && post.resolvedByName && (
                  <p className="mt-2 text-xs text-emerald-700">
                    Resolved by {post.resolvedByName}
                    {post.resolvedAt ? ` on ${formatDateTime(post.resolvedAt)}` : ""}
                  </p>
                )}

                {post.replies.length > 0 && (
                  <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="rounded-md bg-white px-3 py-2">
                        <p className="text-xs font-semibold text-blue-700">{reply.adminName} (Admin)</p>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">
                          {reply.message}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatDateTime(reply.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {isAdmin && (
                  <div className="mt-4 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <textarea
                      value={replyDraftsByPost[post.id] || ""}
                      onChange={(event) =>
                        setReplyDraftsByPost((current) => ({
                          ...current,
                          [post.id]: event.target.value,
                        }))
                      }
                      placeholder="Reply as admin..."
                      className="min-h-[80px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring"
                      maxLength={800}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => submitReply(post.id)}
                        disabled={busy}
                        className={`rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 ${
                          busy ? "cursor-not-allowed opacity-60" : ""
                        }`}
                      >
                        Reply
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleResolved(post)}
                        disabled={busy}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
                          post.resolved
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        } ${busy ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        {post.resolved ? "Mark Open" : "Mark Resolved"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePost(post.id)}
                        disabled={busy}
                        className={`inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 ${
                          busy ? "cursor-not-allowed opacity-60" : ""
                        }`}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeedbackHub;
