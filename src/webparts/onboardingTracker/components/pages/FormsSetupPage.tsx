import * as React from 'react';
import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button';
import { Dropdown } from '@fluentui/react/lib/Dropdown';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { Spinner } from '@fluentui/react/lib/Spinner';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import QuestionEditor from './features/forms/QuestionEditor';
import type { IFormDraft } from './features/forms/FormsSetupTypes';
import { EMPTY_FORM, newQuestion, validateForm } from './features/forms/FormsSetupTypes';
import { useFormsSetup } from './features/forms/useFormsSetup';

type FormsSetupPageProps = Pick<IOnboardingTrackerProps, 'listService' | 'createListService'>;

export default function FormsSetupPage(props: FormsSetupPageProps): React.ReactElement {
  const { tasks, loading, error, loadForm, saveForm } = useFormsSetup(props);
  const [taskId, setTaskId] = React.useState<number | undefined>();
  const [original, setOriginal] = React.useState<IFormDraft>(EMPTY_FORM);
  const [draft, setDraft] = React.useState<IFormDraft>(EMPTY_FORM);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [failure, setFailure] = React.useState('');

  const task = tasks.filter(t => t.id === taskId)[0];
  const dirty = JSON.stringify(original) !== JSON.stringify(draft);

  React.useEffect(() => {
    if (taskId === undefined) {
      return undefined;
    }
    let cancelled = false;
    setBusy(true);
    setFailure('');
    setMessage('');
    loadForm(taskId)
      .then(form => {
        if (!cancelled) {
          setOriginal(form);
          setDraft(form);
        }
      })
      .catch((e: Error) => { if (!cancelled) { setFailure(e.message); } })
      .then(() => { if (!cancelled) { setBusy(false); } }, () => undefined);
    return () => { cancelled = true; };
  }, [taskId, loadForm]);

  const selectTask = (id: number): void => {
    if (dirty && !window.confirm('Хадгалаагүй өөрчлөлт устах болно. Үргэлжлүүлэх үү?')) {
      return;
    }
    setOriginal(EMPTY_FORM);
    setDraft(EMPTY_FORM);
    setTaskId(id);
  };

  const save = async (): Promise<void> => {
    if (!task) {
      return;
    }
    const problem = validateForm(draft);
    if (problem) {
      setFailure(problem);
      return;
    }
    setBusy(true);
    setFailure('');
    setMessage('');
    try {
      const saved = await saveForm(task, original, draft);
      setOriginal(saved);
      setDraft(saved);
      setMessage('Хадгалагдлаа.');
    } catch (e) {
      setFailure((e as Error).message);
      // partial saves are possible, so show what is actually stored now
      try {
        const current = await loadForm(task.id);
        setOriginal(current);
      } catch {
        // keep the original error
      }
    } finally {
      setBusy(false);
    }
  };

  const updateQuestion = (key: string, next: IFormDraft['questions'][number]): void =>
    setDraft(current => ({ ...current, questions: current.questions.map(q => q.key === key ? next : q) }));

  const moveQuestion = (index: number, delta: number): void =>
    setDraft(current => {
      const target = index + delta;
      if (target < 0 || target >= current.questions.length) {
        return current;
      }
      const questions = current.questions.slice();
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...current, questions };
    });

  const removeQuestion = (key: string): void => {
    if (!window.confirm('Энэ асуултыг хасах уу? Хадгалахад асуулт болон түүний хариултууд устна.')) {
      return;
    }
    setDraft(current => ({ ...current, questions: current.questions.filter(q => q.key !== key) }));
  };

  return (
    <div className="tw-min-h-full tw-bg-white tw-p-5">
    <div className="tw-flex tw-w-1/2 tw-min-w-[480px] tw-max-w-full tw-flex-col tw-gap-4">
      <h2 className="tw-m-0 tw-text-base tw-font-semibold">Forms төрлийн task-ийн асуулт, хариулт</h2>

      {error && <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>}
      {failure && <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setFailure('')}>{failure}</MessageBar>}
      {message && <MessageBar messageBarType={MessageBarType.success} onDismiss={() => setMessage('')}>{message}</MessageBar>}
      {loading && <Spinner label="Ачаалж байна..." />}

      {!loading && (
        <Dropdown
          className="tw-max-w-xl"
          label="Task"
          placeholder={tasks.length > 0 ? 'Forms төрлийн task сонгох' : 'Forms төрлийн task алга'}
          disabled={busy || tasks.length === 0}
          options={tasks.map(t => ({ key: t.id, text: t.title }))}
          selectedKey={taskId}
          onChange={(_, option) => { if (option) { selectTask(Number(option.key)); } }}
        />
      )}

      {task && (
        <>
          {busy && <Spinner label="Түр хүлээнэ үү..." />}

          {!busy && draft.questions.length === 0 && (
            <p className="tw-m-0 tw-text-sm tw-text-gray-500">Асуулт алга. Асуулт нэмнэ үү.</p>
          )}

          <div className="tw-flex tw-flex-col tw-gap-3">
            {draft.questions.map((question, index) => (
              <QuestionEditor
                key={question.key}
                question={question}
                index={index}
                count={draft.questions.length}
                disabled={busy}
                onChange={next => updateQuestion(question.key, next)}
                onMove={delta => moveQuestion(index, delta)}
                onRemove={() => removeQuestion(question.key)}
              />
            ))}
          </div>

          <div className="tw-flex tw-gap-2">
            <DefaultButton
              iconProps={{ iconName: 'Add' }}
              text="Асуулт нэмэх"
              disabled={busy}
              onClick={() => setDraft(current => ({ ...current, questions: [...current.questions, newQuestion()] }))}
            />
            <PrimaryButton text="Хадгалах" disabled={busy || !dirty} onClick={() => { save().catch(() => undefined); }} />
            <DefaultButton text="Болих" disabled={busy || !dirty} onClick={() => setDraft(original)} />
          </div>
        </>
      )}
    </div>
    </div>
  );
}
