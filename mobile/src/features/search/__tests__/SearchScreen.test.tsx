import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { SearchScreen } from '@/features/search/SearchScreen';
import * as searchApi from '@/api/search';
import { list as recentList } from '@/lib/recentSearches';
import type { Page, UserDto } from '@/api/types';

jest.mock('@/api/search');

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

const users = searchApi.users as jest.MockedFunction<typeof searchApi.users>;
const posts = searchApi.posts as jest.MockedFunction<typeof searchApi.posts>;

const ALICE: UserDto = {
  id: 42,
  username: 'alice',
  displayName: 'Alice Wong',
  avatarUrl: null,
  bio: 'coffee + code',
};

function page<T>(content: T[]): Page<T> {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1, last: true };
}

const metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <SearchScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  await AsyncStorage.clear();
  users.mockResolvedValue(page([ALICE]));
  posts.mockResolvedValue(page([]));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SearchScreen', () => {
  it('debounces the query then calls search.users', async () => {
    const { getByLabelText } = await renderScreen();

    await act(async () => {
      fireEvent.changeText(getByLabelText('Search'), 'al');
    });
    expect(users).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(users).toHaveBeenCalledWith('al', 0);
  });

  it('does not call the API for queries under 2 chars', async () => {
    const { getByLabelText } = await renderScreen();

    await act(async () => {
      fireEvent.changeText(getByLabelText('Search'), 'a');
    });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(users).not.toHaveBeenCalled();
  });

  it('records the term and navigates on a result tap', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    await act(async () => {
      fireEvent.changeText(getByLabelText('Search'), 'al');
    });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(getByText('Alice Wong')).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByText('Alice Wong'));
    });

    expect(mockNavigate).toHaveBeenCalledWith('UserProfile', { userId: 42 });
    await waitFor(async () => expect(await recentList()).toEqual(['al']));
  });

  it('Cancel goes back', async () => {
    const { getByText } = await renderScreen();
    fireEvent.press(getByText('Cancel'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
