declare type NavigationType = {
  [key: string]: {
    name: string;
    icon: any;
    secondary: boolean;
    adminonly: boolean;
    pledgeonly: boolean;
  };
};

declare type SideBarArgsType = {
  Logo: string;
  Navigation: NavigationType;
  CurrTab: string,
  ImageUrl: string;
  CurrentUserName: string;
  Admin: boolean;
  Pledge: boolean;
  uid:string;
  onTabClick: (tab: string) => void;
};

declare type UserProfileType = {
  about?: string;
  allowed?: boolean;
  email_viewable?: boolean;
  internships?: string;
  graduation_year?: string;
  workplace?: string;
  internships_viewable?: boolean;
  cover_resized_link?: string;
  phone?: string;
  signed_up?: boolean;
  standing_viewable?: boolean;
  announcement_level?: number;
  cover_page_link?: string;
  banner_activity?: string;
  email?: string;
  instagram?: string;
  leetcode?: { username?: string; offsets?: any; answers?: any };
  linkedin?: string;
  major?: string;
  majors?: string[];
  minor?: string;
  minors?: string[];
  name?: string;
  pfp_large_link?: string;
  pfp_thumb_link?: string;
  profile_pic_link?: string;
  resume_link?: string;
  resume_filename?: string;
  role?: string;
  year?: string;
};
