import { MatchStatus, NewsCategory, SquadType } from "@prisma/client";

export const statusLabelMap: Record<MatchStatus, string> = {
  UPCOMING: "未开始",
  LIVE: "进行中",
  FINISHED: "已结束",
};

export const squadLabelMap: Record<SquadType, string> = {
  FIRST_TEAM: "一线队",
  ACADEMY: "梯队",
  COACHING_STAFF: "教练组",
};

export const newsCategoryLabelMap: Record<NewsCategory, string> = {
  NEWS: "新闻",
  ANNOUNCEMENT: "公告",
  VIDEO: "视频",
};

export function formatCny(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(input: Date | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(input));
}

export function formatDate(input: Date | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(new Date(input));
}

export function calculateAge(input: Date | string) {
  const birth = new Date(input);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}
