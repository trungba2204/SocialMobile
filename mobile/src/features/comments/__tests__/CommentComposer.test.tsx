import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { CommentComposer } from '@/features/comments/components/CommentComposer';

function renderComposer(onSubmit: (t: string) => Promise<void>) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 640 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <CommentComposer onSubmit={onSubmit} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('CommentComposer', () => {
  it('calls onSubmit with the text and clears the field on success', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, getByLabelText } = await renderComposer(onSubmit);

    await fireEvent.changeText(getByPlaceholderText('Add a comment…'), 'Hello there');
    await fireEvent.press(getByLabelText('Post comment'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Hello there'));
    await waitFor(() => expect(getByPlaceholderText('Add a comment…').props.value).toBe(''));
  });

  it('keeps the text and shows an error when onSubmit rejects', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('nope'));
    const { getByPlaceholderText, getByLabelText, getByText } = await renderComposer(onSubmit);

    await fireEvent.changeText(getByPlaceholderText('Add a comment…'), 'Draft comment');
    await fireEvent.press(getByLabelText('Post comment'));

    await waitFor(() => expect(getByText('Could not post your comment')).toBeTruthy());
    expect(getByPlaceholderText('Add a comment…').props.value).toBe('Draft comment');
  });
});
