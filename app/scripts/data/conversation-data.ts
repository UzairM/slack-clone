const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
const BASE_TIME = Date.now() - TWO_DAYS_MS;

export const sampleConversation = [
  {
    sender: 'human1' as const,
    content: 'Hi!',
    timestamp: BASE_TIME,
  },
  {
    sender: 'human2' as const,
    content: 'What is your favorite holiday?',
    timestamp: BASE_TIME + 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'one where I get to meet lots of different people.',
    timestamp: BASE_TIME + 2 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'What was the most number of people you have ever met during a holiday?',
    timestamp: BASE_TIME + 3 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Hard to keep a count. Maybe 25.',
    timestamp: BASE_TIME + 4 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'Which holiday was that?',
    timestamp: BASE_TIME + 5 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'I think it was Australia',
    timestamp: BASE_TIME + 6 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'Do you still talk to the people you met?',
    timestamp: BASE_TIME + 7 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content:
      "Not really. The interactions are usually short-lived but it's fascinating to learn where people are coming from and what matters to them",
    timestamp: BASE_TIME + 8 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content:
      'Yea, me too. I feel like God often puts strangers in front of you, and gives you an opportunity to connect with them in that moment in deeply meaningful ways. Do you ever feel like you know things about strangers without them telling you?',
    timestamp: BASE_TIME + 9 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'what do you mean?',
    timestamp: BASE_TIME + 10 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content:
      'I think it\'s like a 6th sense, often seen as "cold readings" to people, but can be remarkably accurate. I once sat next to a man in a coffee and I felt a pain in my back. I asked the stranger if he had a pain. It turns out that he did in the exact spot, and said he pulled a muscle while dancing at a party. I had never met the man before and never saw him again.',
    timestamp: BASE_TIME + 11 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: "Wow! That's interesting, borderline spooky",
    timestamp: BASE_TIME + 12 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content:
      'There\'s this practice called "Treasure Hunting" that\'s kind of a fun game you play in a public place. There\'s a book called "The Ultimate Treasure Hunt" that talks about it. You use your creativity to imagine people you will meet, and you write down a description, then you associate them with a positive message or encouraging word. Maybe you saw a teenage boy in a red hat at the shopping mall in your imagination, then while at the mall, you may find someone who matches that description. You show that you have a message for him and that you have a message for a boy in a red hat. You then give him a message of kindness or whatever was on your heart. You have no idea, sometimes you meet someone who is having a really hard day, and it brings them to tears to have a stranger show them love.',
    timestamp: BASE_TIME + 13 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'So, do you do treasure hunting often?',
    timestamp: BASE_TIME + 14 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content:
      "I did more when I was in grad school (and had more time). I would usually go with friends. For a while I would go to the farmers market in Santa Cruz every week and try to feel if there is something I am supposed to tell a stranger. Usually, they are vague hope-filled messages, but it's weird when I blurt out something oddly specific.",
    timestamp: BASE_TIME + 15 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Hi',
    timestamp: BASE_TIME + 16 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'Any plans for the weekend?',
    timestamp: BASE_TIME + 17 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'my friends are gonna visit me this weekend. we might go hiking!',
    timestamp: BASE_TIME + 18 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: "That's great! How's the weather over the weekend? I hope its warm.",
    timestamp: BASE_TIME + 19 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Should be very sunny! you?',
    timestamp: BASE_TIME + 20 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content:
      'Cool! very depressing plans ... stay home and work 😞 I have a project deadline very close.',
    timestamp: BASE_TIME + 21 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: '😐 hope you get your work done very soon! a bug free weekend!',
    timestamp: BASE_TIME + 22 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'Right, very anxious! where do you plan to go for a hike?',
    timestamp: BASE_TIME + 23 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'I am going to Diablo!',
    timestamp: BASE_TIME + 24 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: "Nice, where is that place? I haven't been there",
    timestamp: BASE_TIME + 25 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'hours drive from here. still in bay area',
    timestamp: BASE_TIME + 26 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: "That's cool! How long is the hike?",
    timestamp: BASE_TIME + 27 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Actually no idea, but it will take the entire day for that.',
    timestamp: BASE_TIME + 28 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'nice! sounds fun!',
    timestamp: BASE_TIME + 29 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Hi!',
    timestamp: BASE_TIME + 30 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: "Hey there! What's up???",
    timestamp: BASE_TIME + 31 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Nothing much, how you doin?',
    timestamp: BASE_TIME + 32 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content:
      "I'm in New York this week for Thanksgiving. I'm squatting in the office today and I caught up with an old friend of mine :D",
    timestamp: BASE_TIME + 33 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Oh wow! Sounds like fun! When was the last time you had seen this friend?',
    timestamp: BASE_TIME + 34 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'The last time in New York, back in June.',
    timestamp: BASE_TIME + 35 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: "Ohh okay. I was going to say if it had been a long time maybe it'd be awkward...",
    timestamp: BASE_TIME + 36 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content:
      "Haha, I guess if it's been a very long time there's almost too many life events to catch up on.. especially recently",
    timestamp: BASE_TIME + 37 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Oh really? Has a lot changed in your life recently?',
    timestamp: BASE_TIME + 38 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content:
      "Haha it's probably too much to go into at the moment. Let's just say life is an exciting experience. How about you?",
    timestamp: BASE_TIME + 39 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content:
      'Ahhh sounds exciting indeed! My life is pretty bland. I like routine, but sometimes I wish I had more time for adventures!',
    timestamp: BASE_TIME + 40 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'What kinds of adventures?? Any ones that I would be able to join you on?',
    timestamp: BASE_TIME + 41 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Hmmmm. I really want to try bull riding. Do you have any interest in that?',
    timestamp: BASE_TIME + 42 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: "I'd love to try! Can we schedule something for next week?",
    timestamp: BASE_TIME + 43 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Sure! What does your Saturday look like?',
    timestamp: BASE_TIME + 44 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'Saturday looks pretty good, shall we shoot for something in the morning?',
    timestamp: BASE_TIME + 45 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Hi!',
    timestamp: BASE_TIME + 46 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'hey',
    timestamp: BASE_TIME + 47 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'is it raining pretty bad today?',
    timestamp: BASE_TIME + 48 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'yeah, can walk too far to see all the foodtruck options',
    timestamp: BASE_TIME + 49 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content:
      "surprising that the rain started early this year... I don't like them too much. They make days gloomy",
    timestamp: BASE_TIME + 50 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content:
      "yeah but I think it's good to have some rainy days in bay area, it's pretty dry here 😛",
    timestamp: BASE_TIME + 51 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'Where I grew up, we had lots of water trouble too...',
    timestamp: BASE_TIME + 52 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content:
      "yeah like wise, I've seen a pretty bad snowstorm when I was at my undergrad school, all flights canceled and traffics went down",
    timestamp: BASE_TIME + 53 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content:
      "Haha... I don't think I can survive in that weather ever. Just the rains at 50 degrees make me want to sit in heated rroms",
    timestamp: BASE_TIME + 54 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'yeah how do you like it in bay area though? I think we need more rain here',
    timestamp: BASE_TIME + 55 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content:
      'people say there is drought here... but we have 24 hours water supply here ... lol... never seen that in a drought ridden area',
    timestamp: BASE_TIME + 56 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: "it is pretty dry in the mountains I believe, that's what causes fire",
    timestamp: BASE_TIME + 57 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content:
      'hmm.... okay. Climate change talk this morning was pretty darn interesting. did you see it?',
    timestamp: BASE_TIME + 58 * 60 * 1000,
  },
  {
    sender: 'human2' as const,
    content: 'nope, what does it say?',
    timestamp: BASE_TIME + 59 * 60 * 1000,
  },
  {
    sender: 'human1' as const,
    content: 'they were talking about how AI is helping climate change. Nice use of upcoming tech.',
    timestamp: BASE_TIME + 60 * 60 * 1000,
  },
];

// Update persona mappings based on the full conversation
export const personaMapping = {
  human1: {
    userId: '@human1:localhost',
    displayName: 'Human 1',
    personality: 'curious, casual, and adventure-loving',
    tone: 'friendly and laid-back',
    interests: [
      'meeting new people',
      'traveling',
      'hiking',
      'outdoor activities',
      'social interactions',
    ],
    responseStyle: 'concise and casual with occasional emojis',
  },
  human2: {
    userId: '@human2:localhost',
    displayName: 'Human 2',
    personality: 'spiritual, empathetic, and hardworking',
    tone: 'warm and expressive',
    interests: [
      'spirituality',
      'human connections',
      'helping others',
      'treasure hunting',
      'work',
      'travel',
    ],
    responseStyle: 'detailed and emotionally aware, uses emojis to express feelings',
  },
};
