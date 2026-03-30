import { User, Post, Notification, Conversation } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  name: 'Lê Minh Anh',
  handle: '@minhanh_le',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAU-xdxbCWQPx9ic0amGgrY2Z7t3WuaqVzTuqFhmz-S3NbyKmAHcUNgphoesjqyZND9SmS9aUKamlCk56KTSHnTUQm4Qyx_SSywYFW29qIlg6c4vyFiLiCajUXTzxrCdEPf_qfFptDbo43sTXQA1J1LegU4G0IAFctUjXlmkohcYhlfdoQ5Cx92dz6YGTRw7t4KhFzww-zuQ0vyvLM8wQnhyUQkN9kXShRqCjaPtN8xO4tG4YrPv1OEs4P2LZW174djsYcHS3O6WCw5',
  bio: 'Kiến trúc sư tâm hồn & Nhà sáng tạo nội dung. Đam mê nghệ thuật sống tối giản và sự tĩnh lặng trong kỷ nguyên số. 🌿✨',
  isPremium: true,
};

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: {
      id: '1',
      name: 'An Nhiên',
      handle: '@annhien',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCEk0Y1VjbvDbE98aEkT1Ph5C7e0f6xNkZ4BQd5umAk6015oUs_tsMqcRu4CEJt6zBorjhx0BEoUg7Hhf1CZmMPxwS0MSxkAUWgkFJPGf1gZR_0Oa_JsRFU_teu--VDomZCNCEnXZ3mr9p98ajXlVMKQH7UXwwjvQgbMGkM7rY1mIXh9-Y1rohygsVxVk8KxPXyIAw1Kh-NUNFA0nMmVZNFKBYbog4ZGK_4R1JKd1iAdXWvNojllFB-A_X0ZegMMuqWUgNe4HqJW30',
    },
    content: 'Sáng nay thức dậy, cảm thấy thật bình yên khi được thưởng thức tách cà phê trong không gian tĩnh lặng. Đôi khi hạnh phúc chỉ đơn giản là vậy. 🌱',
    timestamp: '2 giờ trước',
    likes: 124,
    comments: 18,
  },
  {
    id: '2',
    author: {
      id: '2',
      name: 'Minh Quân',
      handle: '@minhquan',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJWxeTK8IWXsC8csLNCM1Axk-lfR4U9097RKCnnD3sJPXEP7UQgHCYmuxyiT0ON0pmk9Tnxs_VQTYt-p-cwvzMeKqgyPZEBRcykkPPKfCMMy7JvZJ-Z1jYL6hXAXjkfaeKJavqXeuFFSe_czVLUWLRr-ZCuHYRUH_dYn-kKjYHWhUXuQcPQb7sk8pc1K0sFt4WcQk5P96cD6PCdGvfHhHDA4vWsiqvCQ5Z6lMajN6YN7H6enYiCS97DtKZzW3RuUPSbEuX5M7N0YHx',
    },
    content: 'Vừa hoàn thành dự án thiết kế mới cho một ứng dụng thiền. Nexora thực sự truyền cho mình nhiều cảm hứng về sự tối giản. Mọi người cuối tuần thế nào?',
    timestamp: '4 giờ trước',
    likes: 89,
    comments: 12,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrH7KG5yvO70laMYDrSwb8P7-RUfRdj6urZxy3qagpAyL-_piv-SOk31ZbgOP5_j8sXjYuWegmiPytwyOZOXmFQwqKUskyHNr50OsxKbDGBaSR_65axrypP653L55zIq22QPale2uhlNXlOeimAM_23Zhq65UT91_PQmgj324GwTANCJzjD6mSlPhxUZClWmrcrDIRLjMncp5Fb4dbA2dRsZKxLZvph6Q_IyJ_7oAfmqIFmTv4eolYz8iZ5M4hASrq9drkxEI38oU3',
  },
];

export const SUGGESTED_USERS: User[] = [
  {
    id: '3',
    name: 'Linh Chi',
    handle: '@linhchi_art',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaqk2FD0lie1B4m9PNvWI5M5G3Hp-e91S83z4E4CbCZ68jv3wqgUIFsLgq-7FpBMrp_B4GX2mhmQJ0nL5muuTwp-6uNRPn7Cne7z0xdHpxj8Zobp578-ByK6SV5xUTfIhASuQ8M9AWiDkzRy96Jk5GvxPbF-CzEE33TpTij8fiy_ClL_BxyIJfser7tACgwXxVtbilVXb1Oy-NK5lPr59xp_KEUfFPhxbb4CaApYaTC3vS9KiGG5FAHkoqR21PVx73A5-9kooYy0TU',
    role: 'Nhà thơ tự do',
  },
  {
    id: '4',
    name: 'Hoàng Bách',
    handle: '@hoangbach',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB04OcuYQ5qOqkTJ7_eb3Bh8lXEq1Hry3LSaMIq1HfTEMKCwkMwlc52XR7DqjAs2hN-23r5j0Dmn3mE-VtaEcYdI843Bmoz2Af_9NGB485H_S_VkWCwDlqCmOxZM7VS-_ewjZkqUh-NpTw-OzITe7A1WsYBme5p4ixpC-25KrnFgqukKqAAePaI5Kr9_HaTIIj9LAgB7jMKEYYz_Kes2kXBE_zjHVs4qTivHBlPt4imr7EW1fUzaKEPQ3CfkY3vJD4EnXWmSFK0OBSp',
    role: 'Travel Blogger',
  },
  {
    id: '5',
    name: 'Thảo Vy',
    handle: '@thaovy_yoga',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXFanxl0eQIksP4beTM60GkatcD0TFFRedcUVm0Z1mxEyoYP6ZtRQN5iMWR_qcV9-tm_fgzMLRSMkPGsUkiWA09fHYMV6tzNBVPh4hMbTNCJfJKAqy_FjAjmT8dRGQetIsGlS9h9Hpk7-ocCveuzEdy9qHDrZGWb0A9F51wApJsTjdWDfy23G62s7XBVXOOR57OlKVhYVIrTqMY1jNwVbDjAu0f7u9TxLqINseBN6DiD7K2IC5DpZgHVWkyHUXMwjb3PYaHdmexsFe',
    role: 'Yogi & Mindset',
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    participant: {
      id: '6',
      name: 'Lâm Hoàng',
      handle: '@lamhoang',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-Q1pFqZe1DO0nilOljdUUCXedUAG2w8KH24YGH2MP2xBGo4-274f1FX30TfNnzIugRu7jZPfvsUdelO537s4dZMO77x2svH-26bGi1YocihUBkHT6SMQibCgYo6MIqnai_w6yQ_dfKvbItesfGthxbwkVRTEGd8cFxIromW4UdQHNmW2-bMhm-Cj1PXndZ9e5gF_H50fQrYezhTHY2iPGqyb_Yuho0g7Z0KuwKd7HwUF_k2Tkqw5fFqA-O6v_cDZvccfBLiKtgRR_',
    },
    lastMessage: 'Dự án Nexora trông tuyệt vời quá!',
    timestamp: 'Vừa xong',
    unread: true,
  },
  {
    id: '2',
    participant: {
      id: '7',
      name: 'Phương Linh',
      handle: '@phuonglinh',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3v7CI63BnsycnOuFlgbzrIWtopA9vwmC-_P0AWUIslB3WpnmYR6Y-aVeU64WAjRHpynuB7Jr0E5efIvlQDdJZEobcKAUDk7PBFSoQEpdsZvAfoUQwkytYNbl2c6bS6lRe0hCjUZB9sMT4xwrkp61k7Cw-nYmSBVqddV9UInuZKCU7QDDmke8KnLqnkdoJoHMmy5txFjR6GvTSgOU-iIEd5sL7JpMd6snlgOQjX9fDMIRhleJDWS1uwEHjGF0T_nj2cdi3bxAxnch6',
    },
    lastMessage: 'Bạn đã xem bản thảo mới chưa?',
    timestamp: '14:30',
  },
];
