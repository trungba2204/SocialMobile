import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AddStoryScreen } from '@/features/stories/AddStoryScreen';
import * as storiesApi from '@/api/stories';
import { useUiStore } from '@/store/useUiStore';

jest.mock('@/api/stories');

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
}));

const launch = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
  typeof ImagePicker.launchImageLibraryAsync
>;
const create = storiesApi.create as jest.MockedFunction<typeof storiesApi.create>;

const metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <AddStoryScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useUiStore.setState({ toast: null });
  launch.mockResolvedValue({
    canceled: false,
    assets: [
      { uri: 'file:///picked/photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg', width: 1, height: 1, type: 'image' },
    ],
  } as any);
  create.mockResolvedValue({ id: 1 } as any);
});

it('shows the picked image preview using the raw local picker uri', async () => {
  const view = await renderScreen();
  await waitFor(() =>
    expect(view.getByTestId('add-story-preview').props.source).toEqual({
      uri: 'file:///picked/photo.jpg',
    }),
  );
});

it('goes back when the picker is canceled with no image', async () => {
  launch.mockResolvedValueOnce({ canceled: true, assets: null } as any);
  await renderScreen();
  await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
});

it('shares the story and shows a success toast', async () => {
  const view = await renderScreen();
  await waitFor(() => expect(view.getByTestId('add-story-preview')).toBeTruthy());
  await act(async () => {
    fireEvent.press(view.getByText('Share story'));
  });
  expect(create).toHaveBeenCalledWith(
    { uri: 'file:///picked/photo.jpg', name: 'photo.jpg', type: 'image/jpeg' },
    undefined,
  );
  expect(useUiStore.getState().toast?.message).toBe('Story shared');
  expect(mockGoBack).toHaveBeenCalled();
});
