package com.socialapp.config;

import com.socialapp.friend.Friendship;
import com.socialapp.friend.FriendRequest;
import com.socialapp.friend.FriendRequestRepository;
import com.socialapp.friend.FriendshipRepository;
import com.socialapp.conversation.Conversation;
import com.socialapp.conversation.ConversationMember;
import com.socialapp.conversation.ConversationMemberRepository;
import com.socialapp.conversation.ConversationRepository;
import com.socialapp.conversation.Message;
import com.socialapp.conversation.MessageRepository;
import com.socialapp.notification.Notification;
import com.socialapp.notification.NotificationRepository;
import com.socialapp.notification.NotificationType;
import com.socialapp.post.MediaType;
import com.socialapp.post.Post;
import com.socialapp.post.PostMedia;
import com.socialapp.post.PostRepository;
import com.socialapp.post.Privacy;
import com.socialapp.post.comment.Comment;
import com.socialapp.post.comment.CommentRepository;
import com.socialapp.post.like.PostLike;
import com.socialapp.post.like.PostLikeRepository;
import com.socialapp.story.Story;
import com.socialapp.story.StoryRepository;
import com.socialapp.user.Role;
import com.socialapp.user.RoleRepository;
import com.socialapp.user.User;
import com.socialapp.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class SeedDataRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedDataRunner.class);
    private static final String PASSWORD = "Password123!";

    private static final String[][] PEOPLE = {
            {"alice", "Alice Chen", "Product designer. Coffee, trails, typography."},
            {"ben", "Ben Okafor", "Backend engineer. Learning jazz piano."},
            {"chloe", "Chloe Martin", "Photographer & cat person."},
            {"deepak", "Deepak Rao", "Marathoner. Building small things."},
            {"elena", "Elena Rossi", "Illustrator. Plants everywhere."},
            {"felix", "Felix Braun", "Climber, cyclist, occasional cook."},
            {"grace", "Grace Kim", "Data scientist. Board game hoarder."},
            {"hassan", "Hassan Ali", "Teacher. Weekend woodworker."},
            {"ivy", "Ivy Nguyen", "UX researcher. Always reading."},
            {"jonas", "Jonas Berg", "Musician. Analog film enthusiast."},
            {"kira", "Kira Sokolova", "Frontend dev. Bakes sourdough."},
            {"liam", "Liam Walsh", "PM by day, potter by night."}
    };

    private static final String[] POST_TEXTS = {
            "Finally shipped the thing I've been talking about for weeks. Relief.",
            "Morning run in the fog. Everything felt quiet and slow.",
            "Anyone have a good recommendation for a mechanical keyboard?",
            "Made pasta from scratch tonight. Messy kitchen, worth it.",
            "Rereading an old favorite and it hits completely differently now.",
            "Weekend project: fixed the wobbly chair that has annoyed me for a year.",
            "The light this evening was unreal. Had to stop and just look.",
            "Trying to learn one new small thing every day this month.",
            "Coffee shop wifi is down so I'm actually getting work done.",
            "New sketchbook, first page anxiety is real.",
            "Long walk, no podcast, no music. Recommend.",
            "Debugged for three hours. It was a typo. It's always a typo.",
            "Planted tomatoes and basil. Optimism in pot form.",
            "That feeling when the tests finally go green.",
            "Found a tiny bookshop downtown. Dangerous for my wallet."
    };

    private final UserRepository users;
    private final RoleRepository roles;
    private final PostRepository posts;
    private final PostLikeRepository likes;
    private final CommentRepository comments;
    private final FriendshipRepository friendships;
    private final FriendRequestRepository friendRequests;
    private final NotificationRepository notifications;
    private final ConversationRepository conversations;
    private final ConversationMemberRepository conversationMembers;
    private final MessageRepository messages;
    private final StoryRepository stories;
    private final PasswordEncoder passwordEncoder;
    private final SeedProperties properties;

    public SeedDataRunner(UserRepository users, RoleRepository roles, PostRepository posts,
                          PostLikeRepository likes, CommentRepository comments,
                          FriendshipRepository friendships, FriendRequestRepository friendRequests,
                          NotificationRepository notifications, ConversationRepository conversations,
                          ConversationMemberRepository conversationMembers, MessageRepository messages,
                          StoryRepository stories,
                          PasswordEncoder passwordEncoder,
                          SeedProperties properties) {
        this.users = users;
        this.roles = roles;
        this.posts = posts;
        this.likes = likes;
        this.comments = comments;
        this.friendships = friendships;
        this.friendRequests = friendRequests;
        this.notifications = notifications;
        this.conversations = conversations;
        this.conversationMembers = conversationMembers;
        this.messages = messages;
        this.stories = stories;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled() || users.count() > 0) {
            return;
        }
        log.info("Seeding development data...");
        Random rnd = new Random(42);

        Role userRole = roles.findByName(Role.ROLE_USER).orElseGet(() -> roles.save(new Role(Role.ROLE_USER)));
        roles.findByName(Role.ROLE_ADMIN).orElseGet(() -> roles.save(new Role(Role.ROLE_ADMIN)));

        List<User> people = seedUsers(userRole);
        List<Post> allPosts = seedPosts(people, rnd);
        seedEngagement(people, allPosts, rnd);
        seedGraph(people);
        seedNotifications(people, allPosts);
        seedConversations(people);
        seedStories(people);

        log.info("Seed complete: {} users, {} posts", people.size(), allPosts.size());
    }

    private List<User> seedUsers(Role userRole) {
        List<User> people = new ArrayList<>();
        for (int i = 0; i < PEOPLE.length; i++) {
            String[] p = PEOPLE[i];
            User u = new User(p[0] + "@orbit.dev", p[0], passwordEncoder.encode(PASSWORD), p[1]);
            u.setBio(p[2]);
            u.setAvatarUrl("https://i.pravatar.cc/240?img=" + (i + 1));
            u.setCoverUrl("https://picsum.photos/seed/cover" + i + "/900/300");
            u.addRole(userRole);
            people.add(users.save(u));
        }
        return people;
    }

    private List<Post> seedPosts(List<User> people, Random rnd) {
        List<Post> all = new ArrayList<>();
        Privacy[] privacies = {Privacy.PUBLIC, Privacy.PUBLIC, Privacy.PUBLIC, Privacy.FRIENDS, Privacy.PRIVATE};
        for (int i = 0; i < 36; i++) {
            User author = people.get(rnd.nextInt(people.size()));
            Post post = new Post(author, POST_TEXTS[rnd.nextInt(POST_TEXTS.length)],
                    privacies[rnd.nextInt(privacies.length)]);
            if (rnd.nextInt(3) == 0) {
                int count = 1 + rnd.nextInt(3);
                for (int m = 0; m < count; m++) {
                    post.addMedia(new PostMedia(
                            "https://picsum.photos/seed/post" + i + "_" + m + "/800/800",
                            MediaType.IMAGE, m));
                }
            }
            all.add(posts.save(post));
        }
        return all;
    }

    private void seedEngagement(List<User> people, List<Post> allPosts, Random rnd) {
        String[] commentTexts = {
                "Love this.", "So true.", "Congrats!", "This made my day.",
                "How did you do that?", "Been there.", "Beautiful shot.",
                "Adding this to my list.", "Same here.", "Needed to hear this today."
        };
        for (Post post : allPosts) {
            int likeCount = rnd.nextInt(people.size());
            List<User> shuffled = new ArrayList<>(people);
            java.util.Collections.shuffle(shuffled, rnd);
            for (int i = 0; i < likeCount; i++) {
                likes.save(new PostLike(post.getId(), shuffled.get(i).getId()));
            }
            int commentCount = rnd.nextInt(4);
            for (int i = 0; i < commentCount; i++) {
                User commenter = people.get(rnd.nextInt(people.size()));
                comments.save(new Comment(post, commenter,
                        commentTexts[rnd.nextInt(commentTexts.length)], null));
            }
        }
    }

    private void seedGraph(List<User> people) {
        // Chain everyone together so friends-of-friends suggestions have data.
        for (int i = 0; i < people.size() - 1; i++) {
            friendships.save(Friendship.of(people.get(i).getId(), people.get(i + 1).getId()));
        }
        // A few extra cross links.
        friendships.save(Friendship.of(people.get(0).getId(), people.get(4).getId()));
        friendships.save(Friendship.of(people.get(2).getId(), people.get(7).getId()));

        // Pending requests addressed to alice (index 0) from non-friends.
        friendRequests.save(new FriendRequest(people.get(6).getId(), people.get(0).getId()));
        friendRequests.save(new FriendRequest(people.get(9).getId(), people.get(0).getId()));
    }

    private void seedConversations(List<User> people) {
        // alice (index 0) chats with a few of her friends.
        int[] peers = {1, 4, 2}; // ben, elena, chloe
        String[][] scripts = {
                {"Hey, are we still on for coffee tomorrow?",
                 "Yes! 9am at the usual place?",
                 "Perfect. I'll bring the mockups.",
                 "Great, I have some feedback on the onboarding flow.",
                 "Can't wait to hear it.",
                 "See you then!"},
                {"Loved your latest illustration series.",
                 "Thank you! Took forever to get the colors right.",
                 "It shows. The palette is gorgeous.",
                 "We should collaborate on something soon.",
                 "I'm in. Let's sketch ideas this weekend.",
                 "Sending you a moodboard tonight.",
                 "Yes please!"},
                {"Did you get the photos from the hike?",
                 "Just downloaded them, they look amazing.",
                 "That ridge shot is my favorite.",
                 "Same. Printing that one for sure.",
                 "Send me the full res when you can."}
        };
        for (int p = 0; p < peers.length; p++) {
            User peer = people.get(peers[p]);
            User alice = people.get(0);
            Conversation conv = conversations.save(new Conversation(false, null));
            ConversationMember aliceMember = conversationMembers.save(
                    new ConversationMember(conv.getId(), alice.getId()));
            ConversationMember peerMember = conversationMembers.save(
                    new ConversationMember(conv.getId(), peer.getId()));

            String[] lines = scripts[p];
            Message last = null;
            for (int i = 0; i < lines.length; i++) {
                // even index = peer speaks, odd = alice
                Long senderId = (i % 2 == 0) ? peer.getId() : alice.getId();
                last = messages.save(new Message(conv.getId(), senderId, lines[i]));
            }
            conv.setLastMessageId(last.getId());
            conversations.save(conv);

            peerMember.setLastReadMessageId(last.getId());
            // Leave a couple of conversations unread for alice.
            if (p == 0) {
                aliceMember.setLastReadMessageId(last.getId());
                aliceMember.setUnreadCount(0);
            } else {
                aliceMember.setUnreadCount(2);
            }
            conversationMembers.save(aliceMember);
            conversationMembers.save(peerMember);
        }
    }

    private void seedStories(List<User> people) {
        // Active stories across alice's friends (ben/chloe/deepak/elena/felix).
        int[] authorIdx = {1, 2, 3, 4, 5, 1};
        String[] captions = {"Morning light", "On the trail", null, "Studio day", "New print", null};
        for (int i = 0; i < authorIdx.length; i++) {
            Story story = new Story(people.get(authorIdx[i]).getId(),
                    "https://picsum.photos/seed/story" + i + "/600/900",
                    captions[i],
                    Instant.now().plus(Duration.ofHours(20)));
            stories.save(story);
        }
    }

    private void seedNotifications(List<User> people, List<Post> allPosts) {
        User alice = people.get(0);
        List<Post> alicePosts = allPosts.stream()
                .filter(p -> p.getAuthor().getId().equals(alice.getId()))
                .toList();
        NotificationType[] types = {
                NotificationType.POST_LIKE, NotificationType.POST_COMMENT, NotificationType.POST_SHARE
        };
        for (int i = 0; i < 18; i++) {
            User actor = people.get(1 + (i % (people.size() - 1)));
            Long entityId = alicePosts.isEmpty() ? null
                    : alicePosts.get(i % alicePosts.size()).getId();
            Notification n = new Notification(alice.getId(), actor.getId(),
                    types[i % types.length], "POST", entityId);
            if (i % 3 == 0) {
                n.markRead();
            }
            notifications.save(n);
        }
        notifications.save(new Notification(alice.getId(), people.get(6).getId(),
                NotificationType.FRIEND_REQUEST, "USER", people.get(6).getId()));
    }
}
