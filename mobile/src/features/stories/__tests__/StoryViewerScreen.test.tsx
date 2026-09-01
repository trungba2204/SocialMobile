import { render, fireEvent, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { StoryViewerScreen } from '@/features/stories/StoryViewerScreen';
import { MOCK_STORIES } from '@/mock/stories';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
  useRoute: () => ({ params: { userIndex: 0 } }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <StoryViewerScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

const REEL = MOCK_STORIES[0]!;
const COUNT = REEL.stories.length;
const DURATION = REEL.stories[0]!.durationMs;

describe('StoryViewerScreen', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders the first story of the reel for userIndex 0', async () => {
    const view = await renderScreen();
    expect(view.getByText(REEL.author.name)).toBeTruthy();
    expect(view.getByText(`1/${COUNT}`)).toBeTruthy();
    expect(view.getByTestId('story-image').props.source).toEqual({
      uri: REEL.stories[0]!.imageUrl,
    });
  });

  it('advances to the second story once the duration elapses', async () => {
    const view = await renderScreen();
    await act(async () => {
      jest.advanceTimersByTime(DURATION + 100);
    });
    expect(view.getByText(`2/${COUNT}`)).toBeTruthy();
    expect(view.getByTestId('story-image').props.source).toEqual({
      uri: REEL.stories[1]!.imageUrl,
    });
  });

  it('tapping the right zone advances to the next story', async () => {
    const view = await renderScreen();
    await act(async () => {
      fireEvent.press(view.getByLabelText('Next story'));
    });
    expect(view.getByText(`2/${COUNT}`)).toBeTruthy();
  });

  it('tapping the left zone goes back to the previous story', async () => {
    const view = await renderScreen();
    await act(async () => {
      fireEvent.press(view.getByLabelText('Next story'));
    });
    await act(async () => {
      fireEvent.press(view.getByLabelText('Previous story'));
    });
    expect(view.getByText(`1/${COUNT}`)).toBeTruthy();
  });

  it('holding a tap zone pauses the timer, and a quick tap still advances', async () => {
    const view = await renderScreen();
    const zone = view.getByLabelText('Next story');

    // Press and hold well past the story duration.
    await act(async () => {
      fireEvent(zone, 'pressIn');
    });
    await act(async () => {
      jest.advanceTimersByTime(DURATION + 500);
    });
    // Release after the long hold — must NOT advance, and the timer was paused.
    await act(async () => {
      fireEvent(zone, 'pressOut');
    });
    await act(async () => {
      fireEvent.press(zone);
    });
    expect(view.getByText(`1/${COUNT}`)).toBeTruthy();
    expect(mockGoBack).not.toHaveBeenCalled();

    // A quick tap (press + immediate release, under the hold threshold) advances normally.
    await act(async () => {
      fireEvent(zone, 'pressIn');
    });
    await act(async () => {
      fireEvent(zone, 'pressOut');
    });
    await act(async () => {
      fireEvent.press(zone);
    });
    expect(view.getByText(`2/${COUNT}`)).toBeTruthy();
  });

  it('calls navigation.goBack after the last story finishes', async () => {
    const view = await renderScreen();
    for (let i = 0; i < COUNT - 1; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        fireEvent.press(view.getByLabelText('Next story'));
      });
    }
    expect(view.getByText(`${COUNT}/${COUNT}`)).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(REEL.stories[COUNT - 1]!.durationMs + 100);
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('close button calls navigation.goBack', async () => {
    const view = await renderScreen();
    await act(async () => {
      fireEvent.press(view.getByLabelText('Close story'));
    });
    expect(mockGoBack).toHaveBeenCalled();
  });
});
