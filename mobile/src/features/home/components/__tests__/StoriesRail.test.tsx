import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { StoriesRail } from '@/features/home/components/StoriesRail';
import * as storiesApi from '@/api/stories';
import { useAuthStore } from '@/store/useAuthStore';
import type { StoryReelDto } from '@/api/types';

jest.mock('@/api/stories');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));

const reels = storiesApi.reels as jest.MockedFunction<typeof storiesApi.reels>;

function user(id: number, name: string) {
  return { id, username: `u${id}`, displayName: name, avatarUrl: null, bio: null };
}

const REELS: StoryReelDto[] = [
  { author: user(2, 'Maya Okafor'), stories: [], hasUnseen: true },
  { author: user(3, 'Devin Park'), stories: [], hasUnseen: false },
];

const metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function renderRail() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <StoriesRail />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: user(1, 'Me') as any });
});

it('renders "Add story" first, then a card per reel', async () => {
  reels.mockResolvedValue(REELS);
  const view = await renderRail();
  await waitFor(() => expect(view.getByLabelText("Add to your story")).toBeTruthy());
  expect(view.getByLabelText('Add to your story')).toBeTruthy();
  await waitFor(() => expect(view.getByLabelText("Maya Okafor's story")).toBeTruthy());
  expect(view.getByLabelText("Devin Park's story")).toBeTruthy();
  expect(view.getByText('Maya')).toBeTruthy();
});

it('tapping "Add story" navigates to AddStory', async () => {
  reels.mockResolvedValue([]);
  const view = await renderRail();
  await waitFor(() => expect(view.getByLabelText("Add to your story")).toBeTruthy());
  fireEvent.press(view.getByLabelText('Add to your story'));
  expect(mockNavigate).toHaveBeenCalledWith('AddStory');
});

it('tapping a reel navigates to StoryViewer with the author id', async () => {
  reels.mockResolvedValue(REELS);
  const view = await renderRail();
  await waitFor(() => expect(view.getByLabelText("Add to your story")).toBeTruthy());
  await waitFor(() => expect(view.getByLabelText("Maya Okafor's story")).toBeTruthy());
  fireEvent.press(view.getByLabelText("Maya Okafor's story"));
  expect(mockNavigate).toHaveBeenCalledWith('StoryViewer', { authorId: 2 });
});

it('empty reels renders just the "Add story" button', async () => {
  reels.mockResolvedValue([]);
  const view = await renderRail();
  await waitFor(() => expect(view.getByLabelText("Add to your story")).toBeTruthy());
  expect(view.getByLabelText('Add to your story')).toBeTruthy();
  expect(view.queryByLabelText("Maya Okafor's story")).toBeNull();
});

it('on API error renders just "Add story" (no crash, no mock reels) plus a retry', async () => {
  reels.mockRejectedValue(new Error('boom'));
  const view = await renderRail();
  await waitFor(() => expect(view.getByLabelText("Add to your story")).toBeTruthy());
  await waitFor(() => expect(view.getByLabelText('Retry loading stories')).toBeTruthy());
  expect(view.getByLabelText('Add to your story')).toBeTruthy();
  expect(view.queryByLabelText("Maya Okafor's story")).toBeNull();
});
