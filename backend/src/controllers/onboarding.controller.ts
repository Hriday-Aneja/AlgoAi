import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { NextFunction, Response } from "express";
import { ZodError } from "zod";
import {
  createOrUpdateOnboardingRoadmap,
  completeRoadmapDay,
  fetchRoadmap,
  getRoadmapMeta,
} from "../services/onboarding.service";
import {
  completeDaySchema,
  onboardingSchema,
} from "../validators/onboarding.validator";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../types/express";

const EXPERIENCE_LEVEL_ALIASES: Record<string, string> = {
  beginner: "beginner",
  basic: "intermediate",
  intermediate: "intermediate",
  advanced: "advanced",
};

const ONBOARDING_TOPIC_ALIASES: Record<string, string[]> = {
  arrays: ["arrays"],
  strings: ["strings"],
  "linked list": ["linked-list"],
  "linked-list": ["linked-list"],
  stack: ["stack"],
  queue: ["queue"],
  hashing: ["hashing"],
  "two pointers": ["two-pointers"],
  "two-pointers": ["two-pointers"],
  "sliding window": ["sliding-window"],
  "sliding-window": ["sliding-window"],
  "binary search": ["binary-search"],
  "binary-search": ["binary-search"],
  recursion: ["recursion"],
  backtracking: ["backtracking"],
  trees: ["trees"],
  bst: ["bst"],
  heaps: ["heaps"],
  greedy: ["greedy"],
  graphs: ["graphs"],
  dp: ["dp"],
  "dynamic programming": ["dp"],
  trie: ["trie"],
  "bit manipulation": ["bit-manipulation"],
  "bit-manipulation": ["bit-manipulation"],
  "stack & queue": ["stack", "queue"],
};

const normalizeOnboardingPayload = (body: any) => {
  const experienceLevel = typeof body?.experienceLevel === "string"
    ? EXPERIENCE_LEVEL_ALIASES[body.experienceLevel.toLowerCase().trim()] ?? body.experienceLevel.toLowerCase().trim()
    : body?.experienceLevel;

  const preferredTopics = Array.isArray(body?.preferredTopics)
    ? Array.from(
        new Set(
          body.preferredTopics.flatMap((topic: unknown) => {
            if (typeof topic !== "string") return [];
            const normalized = topic.toLowerCase().trim();
            return ONBOARDING_TOPIC_ALIASES[normalized] ?? [];
          }),
        ),
      )
    : body?.preferredTopics;

  return {
    ...body,
    experienceLevel,
    preferredTopics,
  };
};

const createGuestId = (): string => `guest_${uuidv4()}`;

const createGuestUser = async (guestId: string) => {
  const guestEmail = `${guestId}@guest.algoai`;
  const guestPassword = uuidv4().replace(/-/g, '').slice(0, 10);
  const hashedPassword = await bcrypt.hash(guestPassword, 10);

  return prisma.user.create({
    data: {
      id: guestId,
      email: guestEmail,
      password: hashedPassword,
      name: "Guest User",
    },
  });
};

export const submitOnboarding = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let userId = req.auth?.userId;

    if (!userId) {
      const guestId = createGuestId();
      userId = guestId;
      console.log('[Onboarding] Guest submission with ID:', userId);

      await createGuestUser(guestId);
    }

    const normalizedBody = normalizeOnboardingPayload(req.body);
    console.log('[Onboarding] Submit request:', {
      userId,
      body: normalizedBody,
      query: req.query,
      params: req.params,
    });

    const payload = onboardingSchema.parse(normalizedBody);
    const result = await createOrUpdateOnboardingRoadmap(userId, payload);

    res.status(200).json({
      ...result,
      userId,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('[Onboarding] Validation failed:', {
        errors: error.flatten(),
        body: req.body,
      });
      res.status(400).json({
        status: "error",
        message: "Validation failed.",
        errors: error.flatten(),
      });
      return;
    }

    next(error);
  }
};

export const updateOnboarding = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
      return;
    }

    const normalizedBody = normalizeOnboardingPayload(req.body);
    const payload = onboardingSchema.parse(normalizedBody);
    const result = await createOrUpdateOnboardingRoadmap(userId, payload);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: "error",
        message: "Validation failed.",
        errors: error.flatten(),
      });
      return;
    }

    next(error);
  }
};

const getUserIdFromRequest = (req: AuthenticatedRequest): string | null => {
  if (req.auth?.userId) {
    return req.auth.userId;
  }

  const queryId = req.query.userId as string | undefined;
  const headerId = typeof req.headers['x-user-id'] === 'string'
    ? req.headers['x-user-id']
    : Array.isArray(req.headers['x-user-id'])
      ? req.headers['x-user-id'][0]
      : undefined;

  return queryId || headerId || null;
};

export const getOnboardingRoadmap = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      console.log('[Onboarding] No userId found - guest trying to fetch without ID');
      res.status(400).json({
        status: "error",
        message: "User ID is required for roadmap fetch.",
      });
      return;
    }

    console.log('[Onboarding] Fetching roadmap for userId:', userId);
    const roadmap = await fetchRoadmap(userId);
    const visibleRoadmap = roadmap.slice(0, 15);
    const roadmapMeta = await getRoadmapMeta(userId, visibleRoadmap.length);
    const annotatedRoadmap = visibleRoadmap.map((day) => ({
      ...day,
      isLocked: day.day > (roadmapMeta.currentRoadmapDay ?? 1),
    }));

    res.status(200).json({
      success: true,
      roadmap: annotatedRoadmap,
      roadmapMeta,
    });
  } catch (error) {
    console.error('[Onboarding] Error fetching roadmap:', error);
    next(error);
  }
};

export const getOnboardingRoadmapMeta = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "User ID is required for roadmap metadata.",
      });
      return;
    }

    const roadmap = await fetchRoadmap(userId);
    const visibleRoadmap = roadmap.slice(0, 15);
    const roadmapMeta = await getRoadmapMeta(userId, visibleRoadmap.length);

    res.status(200).json({
      success: true,
      roadmapMeta,
    });
  } catch (error) {
    next(error);
  }
};

export const getOnboardingRoadmapDay = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "User ID is required for roadmap day fetch.",
      });
      return;
    }

    const day = Number(req.params.day);
    const parsed = completeDaySchema.parse({ day });

    const roadmap = await fetchRoadmap(userId);
    const visibleRoadmap = roadmap.slice(0, 15);
    const roadmapMeta = await getRoadmapMeta(userId, visibleRoadmap.length);

    if (parsed.day > visibleRoadmap.length) {
      res.status(404).json({
        success: false,
        message: "Roadmap day not found.",
      });
      return;
    }

    if (parsed.day > (roadmapMeta.currentRoadmapDay ?? 1)) {
      res.status(403).json({
        success: false,
        message: "This roadmap day is locked until you reach it.",
      });
      return;
    }

    const roadmapDay = visibleRoadmap.find((item) => item.day === parsed.day);
    if (!roadmapDay) {
      res.status(404).json({
        success: false,
        message: "Roadmap day not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      roadmapDay,
      isLocked: roadmapDay.day > (roadmapMeta.currentRoadmapDay ?? 1),
      roadmapMeta,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: "error",
        message: "Invalid day parameter.",
        errors: error.flatten(),
      });
      return;
    }

    next(error);
  }
};

export const completeOnboardingDay = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
      return;
    }

    const day = Number(req.params.day);
    const parsed = completeDaySchema.parse({ day });

    const roadmap = await fetchRoadmap(userId);
    const roadmapMeta = await getRoadmapMeta(userId, roadmap.length);
    if (parsed.day > (roadmapMeta.currentRoadmapDay ?? 1)) {
      res.status(403).json({
        success: false,
        message: "Cannot complete future roadmap days before they unlock.",
      });
      return;
    }

    await completeRoadmapDay(userId, parsed.day);

    res.status(200).json({
      success: true,
      message: "Roadmap day marked as completed.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: "error",
        message: "Invalid day parameter.",
        errors: error.flatten(),
      });
      return;
    }

    next(error);
  }
};
