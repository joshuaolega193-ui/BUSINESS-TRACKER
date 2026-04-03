# ... (Keep the top parts the same) ...

# 5. Copy and install requirements 
# CHANGED: We now look for the file in the root, not inside 'backend/'
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of your code
COPY --chown=user . .

# 7. Expose the Hugging Face default port
EXPOSE 7860

# 8. Start the server
# CHANGED: Since manage.py is now in the root, we remove 'backend/' from the command
CMD python manage.py migrate && \
    gunicorn backend.wsgi:application --bind 0.0.0.0:7860